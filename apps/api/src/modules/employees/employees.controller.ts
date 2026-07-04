import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { DataScopeService } from '../../common/data-scope.service';
import { AuthService } from '../auth/auth.service';
import { EmployeesService } from './employees.service';

type CreateEmployeeRequestBody = {
  fullName?: string;
  branchId?: string;
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

type UpdateEmployeeRequestBody = {
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

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly authService: AuthService,
    private readonly employeesService: EmployeesService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get()
  async listEmployees(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return {
      employees: await this.employeesService.listEmployeesForTenant(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  @Post()
  async createEmployee(
    @Req() request: Request,
    @Body() body: CreateEmployeeRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return {
      employee: await this.employeesService.createEmployee(
        session.user.tenant.id,
        {
          fullName: body.fullName ?? '',
          branchId: body.branchId ?? session.user.branch.id,
          idNumber: body.idNumber,
          phone: body.phone,
          sex: body.sex,
          dateOfBirth: body.dateOfBirth,
          job: body.job,
          salary: body.salary,
          workType: body.workType,
          startDate: body.startDate,
          endDate: body.endDate,
          isUser: body.isUser,
        },
      ),
    };
  }

  @Get(':employeeId')
  async getEmployee(
    @Req() request: Request,
    @Param('employeeId') employeeId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      employee: await this.employeesService.getEmployeeForTenant(
        session.user.tenant.id,
        employeeId,
      ),
    };
  }

  @Patch(':employeeId')
  async updateEmployee(
    @Req() request: Request,
    @Param('employeeId') employeeId: string,
    @Body() body: UpdateEmployeeRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return {
      employee: await this.employeesService.updateEmployee(
        session.user.tenant.id,
        employeeId,
        body,
      ),
    };
  }

  private async getRequiredSession(cookieHeader: string | undefined) {
    const session = await this.authService.getCurrentSessionFromCookieHeader(cookieHeader);
    if (!session) throw new UnauthorizedException('Authentication required.');
    return session;
  }
}
