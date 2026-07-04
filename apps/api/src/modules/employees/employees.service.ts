import { Injectable, NotFoundException } from '@nestjs/common';
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
  isUser?: boolean;
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
  isUser?: boolean;
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
    });
    return employees.map((e) => this.serialize(e));
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
        isUser: input.isUser,
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
        ...(input.isUser !== undefined && { isUser: input.isUser }),
      },
    });

    return this.serialize(employee);
  }

  // Postgres Decimal/Date columns come back from Prisma as Decimal/Date
  // objects; the API contract (and the web app, which calls
  // `.toLocaleString()` on salary and displays dates as plain text) expects
  // a plain number and "YYYY-MM-DD" strings, same as the old JSON store.
  private serialize(employee: Employee) {
    return {
      ...employee,
      salary: toNumber(employee.salary),
      dateOfBirth: toDateOnlyString(employee.dateOfBirth),
      startDate: toDateOnlyString(employee.startDate),
      endDate: toDateOnlyString(employee.endDate),
    };
  }
}
