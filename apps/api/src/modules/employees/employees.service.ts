import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  EmployeeRecord,
  readOperationsStore,
  writeOperationsStore,
} from '../../data/operations-store';

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

@Injectable()
export class EmployeesService {
  listEmployeesForTenant(tenantId: string): EmployeeRecord[] {
    return readOperationsStore().employees.filter((e) => e.tenantId === tenantId);
  }

  listEmployeesForScope(tenantId: string, branchId: string): EmployeeRecord[] {
    return readOperationsStore().employees.filter(
      (e) => e.tenantId === tenantId && e.branchId === branchId && e.status === 'active',
    );
  }

  getEmployeeForTenant(tenantId: string, employeeId: string): EmployeeRecord {
    const store = readOperationsStore();
    const employee = store.employees.find(
      (e) => e.id === employeeId && e.tenantId === tenantId,
    );
    if (!employee) throw new NotFoundException('Employee not found.');
    return employee;
  }

  createEmployee(tenantId: string, input: CreateEmployeeInput): EmployeeRecord {
    const store = readOperationsStore();
    const tenantEmployees = store.employees.filter((e) => e.tenantId === tenantId);

    const maxSeq = tenantEmployees.reduce((max, e) => {
      const match = e.employeeNumber.match(/^EMP-(\d{4})$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    const next = String(maxSeq + 1).padStart(4, '0');
    const employeeNumber = `EMP-${next}`;

    const employee: EmployeeRecord = {
      id: `employee-${randomUUID()}`,
      tenantId,
      branchId: input.branchId,
      employeeNumber,
      fullName: input.fullName.trim(),
      status: 'active',
      ...(input.idNumber !== undefined && { idNumber: input.idNumber }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.sex !== undefined && { sex: input.sex }),
      ...(input.dateOfBirth !== undefined && { dateOfBirth: input.dateOfBirth }),
      ...(input.job !== undefined && { job: input.job }),
      ...(input.salary !== undefined && { salary: input.salary }),
      ...(input.workType !== undefined && { workType: input.workType }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.isUser !== undefined && { isUser: input.isUser }),
    };

    store.employees.push(employee);
    writeOperationsStore(store);
    return employee;
  }

  updateEmployee(
    tenantId: string,
    employeeId: string,
    input: UpdateEmployeeInput,
  ): EmployeeRecord {
    const store = readOperationsStore();
    const idx = store.employees.findIndex(
      (e) => e.id === employeeId && e.tenantId === tenantId,
    );
    if (idx === -1) throw new NotFoundException('Employee not found.');

    const updated: EmployeeRecord = {
      ...store.employees[idx],
      ...(input.fullName !== undefined && { fullName: input.fullName.trim() }),
      ...(input.branchId !== undefined && { branchId: input.branchId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.idNumber !== undefined && { idNumber: input.idNumber }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.sex !== undefined && { sex: input.sex }),
      ...(input.dateOfBirth !== undefined && { dateOfBirth: input.dateOfBirth }),
      ...(input.job !== undefined && { job: input.job }),
      ...(input.salary !== undefined && { salary: input.salary }),
      ...(input.workType !== undefined && { workType: input.workType }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.isUser !== undefined && { isUser: input.isUser }),
    };

    store.employees[idx] = updated;
    writeOperationsStore(store);
    return updated;
  }
}
