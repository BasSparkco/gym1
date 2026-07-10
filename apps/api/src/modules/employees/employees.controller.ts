import {
  Body,
  Controller,
  Delete,
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
  coachProfile?: { specializations?: string[]; certifications?: string[] };
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
          coachProfile: body.coachProfile,
        },
      ),
    };
  }

  @Get('coaches')
  async listCoaches(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return {
      coaches: await this.employeesService.listCoachesForTenant(
        session.user.tenant.id,
        branchId,
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

  @Get(':employeeId/coach-profile')
  async getCoachProfile(
    @Req() request: Request,
    @Param('employeeId') employeeId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      coachProfile: await this.employeesService.getCoachProfile(
        session.user.tenant.id,
        employeeId,
      ),
    };
  }

  @Patch(':employeeId/coach-profile')
  async upsertCoachProfile(
    @Req() request: Request,
    @Param('employeeId') employeeId: string,
    @Body() body: { specializations?: string[]; certifications?: string[] },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return {
      coachProfile: await this.employeesService.upsertCoachProfile(
        session.user.tenant.id,
        employeeId,
        body,
      ),
    };
  }

  @Delete(':employeeId/coach-profile')
  async removeCoachProfile(
    @Req() request: Request,
    @Param('employeeId') employeeId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    await this.employeesService.removeCoachProfile(
      session.user.tenant.id,
      employeeId,
    );
    return { ok: true };
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
