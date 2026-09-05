import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { parseDateOnly, toDateOnlyString } from '../../common/date';
import { toNumber } from '../../common/decimal';
import { normalizePhone } from '../../common/phone';
import { nextEmployeeNumber } from '../../common/org-numbering';
import { findCountryByCode } from '../../data/countries';
import { EmployeeAttendanceService } from '../employee-attendance/employee-attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Branch,
  Employee,
  GateAccessScope,
} from '../../generated/prisma/client';

export type CreateEmployeeInput = {
  fullName: string;
  branchId: string;
  idNumber?: string;
  phone?: string;
  sex?: 'male' | 'female';
  dateOfBirth?: string;
  job?: string;
  salary?: number;
  workType?: 'fullTime' | 'partTime' | 'trainee';
  startDate?: string;
  endDate?: string;
  coachProfile?: { specializations?: string[]; certifications?: string[] };
  gateAccessScope?: GateAccessScope;
  gateIds?: string[];
};

export type UpdateEmployeeInput = {
  fullName?: string;
  branchId?: string;
  status?: 'active' | 'inactive';
  idNumber?: string;
  phone?: string;
  sex?: 'male' | 'female';
  dateOfBirth?: string;
  job?: string;
  salary?: number;
  workType?: 'fullTime' | 'partTime' | 'trainee';
  startDate?: string;
  endDate?: string;
};

function toDate(
  value: string | undefined,
  fieldName: string,
): Date | undefined {
  return parseDateOnly(value, fieldName);
}

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeeAttendanceService: EmployeeAttendanceService,
  ) {}

  async listEmployeesForTenant(tenantId: string, branchId?: string) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, ...(branchId ? { branchId } : {}) },
      include: { user: { select: { id: true, email: true } } },
    });
    return employees.map((e) => this.serialize(e));
  }

  /** Employees with a coach profile — used to populate coach pickers when
   * scheduling classes or setting a program's default coach. */
  async listCoachesForTenant(tenantId: string, branchId?: string) {
    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId,
        status: 'active',
        coachProfile: { isNot: null },
        ...(branchId ? { branchId } : {}),
      },
      include: { coachProfile: true },
    });
    return employees.map((e) => ({
      ...this.serialize(e),
      coachProfile: e.coachProfile,
    }));
  }

  async getCoachProfile(tenantId: string, employeeId: string) {
    await this.getEmployeeForTenant(tenantId, employeeId);
    return this.prisma.coachProfile.findUnique({ where: { employeeId } });
  }

  async upsertCoachProfile(
    tenantId: string,
    employeeId: string,
    input: { specializations?: string[]; certifications?: string[] },
  ) {
    await this.getEmployeeForTenant(tenantId, employeeId);

    return this.prisma.coachProfile.upsert({
      where: { employeeId },
      create: {
        employeeId,
        specializations: input.specializations ?? [],
        certifications: input.certifications ?? [],
      },
      update: {
        ...(input.specializations !== undefined && {
          specializations: input.specializations,
        }),
        ...(input.certifications !== undefined && {
          certifications: input.certifications,
        }),
      },
    });
  }

  async removeCoachProfile(tenantId: string, employeeId: string) {
    await this.getEmployeeForTenant(tenantId, employeeId);

    // Class sessions and program defaults reference the Employee, so deleting
    // the profile wouldn't break FKs — but it would make this coach invisible
    // to the pickers while still being scheduled. Block until reassigned.
    const [programCount, upcomingSessionCount] = await Promise.all([
      this.prisma.trainingProgram.count({
        where: { defaultCoachId: employeeId },
      }),
      this.prisma.classSession.count({
        where: { coachId: employeeId, date: { gte: new Date() } },
      }),
    ]);
    if (programCount > 0 || upcomingSessionCount > 0) {
      throw new BadRequestException(
        'This coach is still assigned to training programs or upcoming class sessions. Reassign those first.',
      );
    }

    await this.prisma.coachProfile.deleteMany({ where: { employeeId } });
  }

  async listEmployeesForScope(tenantId: string, branchId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, branchId, status: 'active' },
    });
    return employees.map((e) => this.serialize(e));
  }

  async getEmployeeForTenant(tenantId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!employee) throw new NotFoundException('Employee not found.');
    return this.serialize(employee);
  }

  async createEmployee(tenantId: string, input: CreateEmployeeInput) {
    const [tenant, branch] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { code: true },
      }),
      this.prisma.branch.findUnique({ where: { id: input.branchId } }),
    ]);
    const employeeNumber = await nextEmployeeNumber(
      this.prisma,
      tenantId,
      tenant?.code ?? null,
    );
    const phone = normalizePhone(
      input.phone,
      branch ? this.getDialCodeForBranch(branch) : undefined,
    );

    const employee = await this.prisma.employee.create({
      data: {
        id: `employee-${randomUUID()}`,
        tenantId,
        branchId: input.branchId,
        employeeNumber,
        fullName: input.fullName.trim(),
        status: 'active',
        idNumber: input.idNumber,
        phone,
        sex: input.sex,
        dateOfBirth: toDate(input.dateOfBirth, 'Date of birth'),
        job: input.job,
        salary: input.salary,
        workType: input.workType,
        startDate: toDate(input.startDate, 'Start date'),
        endDate: toDate(input.endDate, 'End date'),
        // Nested create keeps "employee + coach profile" atomic — no
        // half-created coach if the request fails partway.
        ...(input.coachProfile && {
          coachProfile: {
            create: {
              specializations: input.coachProfile.specializations ?? [],
              certifications: input.coachProfile.certifications ?? [],
            },
          },
        }),
      },
    });

    if (input.gateAccessScope !== undefined) {
      await this.employeeAttendanceService.setEmployeeGates(
        tenantId,
        employee.id,
        {
          gateAccessScope: input.gateAccessScope,
          gateIds: input.gateIds ?? [],
        },
      );
      // Keep the returned payload consistent with what was just persisted —
      // `employee` still holds the create-time default (gateAccessScope: branch).
      employee.gateAccessScope = input.gateAccessScope;
    }

    // Automatic QR delivery on creation — best-effort, doesn't fail employee
    // creation if SparkCo is unreachable or the employee has no phone yet.
    const qrDispatch = employee.phone
      ? await this.employeeAttendanceService.sendQrViaWhatsApp(
          tenantId,
          employee.id,
        )
      : undefined;

    return { employee: this.serialize(employee), qrDispatch };
  }

  private getDialCodeForBranch(branch: Branch): string | undefined {
    if (!branch.countryCode) return undefined;
    return findCountryByCode(branch.countryCode)?.dialCode;
  }

  async updateEmployee(
    tenantId: string,
    employeeId: string,
    input: UpdateEmployeeInput,
  ) {
    const existing = await this.getEmployeeForTenant(tenantId, employeeId);

    let phone: string | undefined;
    if (input.phone !== undefined) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: input.branchId ?? existing.branchId },
      });
      phone = normalizePhone(
        input.phone,
        branch ? this.getDialCodeForBranch(branch) : undefined,
      );
    }

    const employee = await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...(input.fullName !== undefined && {
          fullName: input.fullName.trim(),
        }),
        ...(input.branchId !== undefined && { branchId: input.branchId }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.idNumber !== undefined && { idNumber: input.idNumber }),
        ...(input.phone !== undefined && { phone }),
        ...(input.sex !== undefined && { sex: input.sex }),
        ...(input.dateOfBirth !== undefined && {
          dateOfBirth: toDate(input.dateOfBirth, 'Date of birth'),
        }),
        ...(input.job !== undefined && { job: input.job }),
        ...(input.salary !== undefined && { salary: input.salary }),
        ...(input.workType !== undefined && { workType: input.workType }),
        ...(input.startDate !== undefined && {
          startDate: toDate(input.startDate, 'Start date'),
        }),
        ...(input.endDate !== undefined && {
          endDate: toDate(input.endDate, 'End date'),
        }),
      },
    });

    return this.serialize(employee);
  }

  // Postgres Decimal/Date columns come back from Prisma as Decimal/Date
  // objects; the API contract (and the web app, which calls
  // `.toLocaleString()` on salary and displays dates as plain text) expects
  // a plain number and "YYYY-MM-DD" strings, same as the old JSON store.
  private serialize(
    employee: Employee & { user?: { id: string; email: string } | null },
  ) {
    return {
      ...employee,
      salary: toNumber(employee.salary),
      dateOfBirth: toDateOnlyString(employee.dateOfBirth),
      startDate: toDateOnlyString(employee.startDate),
      endDate: toDateOnlyString(employee.endDate),
    };
  }
}
