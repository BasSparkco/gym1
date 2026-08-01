import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { toDateOnlyString } from '../../common/date';
import { toNumber } from '../../common/decimal';
import { PrismaService } from '../../prisma/prisma.service';
import { Employee } from '../../generated/prisma/client';

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

function toDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

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
    // Mirrors the original in-memory scan exactly (rather than a SQL MAX on
    // employeeNumber), since a SQL string max would misbehave if any
    // non-conforming employeeNumber ever sorted lexicographically higher
    // than the true numeric max.
    const tenantEmployees = await this.prisma.employee.findMany({
      where: { tenantId },
      select: { employeeNumber: true },
    });

    const maxSeq = tenantEmployees.reduce((max, e) => {
      const match = e.employeeNumber.match(/^EMP-(\d{4})$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    const employeeNumber = `EMP-${String(maxSeq + 1).padStart(4, '0')}`;

    const employee = await this.prisma.employee.create({
      data: {
        id: `employee-${randomUUID()}`,
        tenantId,
        branchId: input.branchId,
        employeeNumber,
        fullName: input.fullName.trim(),
        status: 'active',
        idNumber: input.idNumber,
        phone: input.phone,
        sex: input.sex,
        dateOfBirth: toDate(input.dateOfBirth),
        job: input.job,
        salary: input.salary,
        workType: input.workType,
        startDate: toDate(input.startDate),
        endDate: toDate(input.endDate),
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

    return this.serialize(employee);
  }

  async updateEmployee(
    tenantId: string,
    employeeId: string,
    input: UpdateEmployeeInput,
  ) {
    await this.getEmployeeForTenant(tenantId, employeeId);

    const employee = await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...(input.fullName !== undefined && {
          fullName: input.fullName.trim(),
        }),
        ...(input.branchId !== undefined && { branchId: input.branchId }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.idNumber !== undefined && { idNumber: input.idNumber }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.sex !== undefined && { sex: input.sex }),
        ...(input.dateOfBirth !== undefined && {
          dateOfBirth: toDate(input.dateOfBirth),
        }),
        ...(input.job !== undefined && { job: input.job }),
        ...(input.salary !== undefined && { salary: input.salary }),
        ...(input.workType !== undefined && { workType: input.workType }),
        ...(input.startDate !== undefined && {
          startDate: toDate(input.startDate),
        }),
        ...(input.endDate !== undefined && { endDate: toDate(input.endDate) }),
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
