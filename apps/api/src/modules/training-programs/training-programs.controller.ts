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
import { TrainingProgramsService } from './training-programs.service';

type CreateTrainingProgramRequestBody = {
  name?: string;
  branchId?: string | null;
  description?: string;
  color?: string;
  icon?: string;
  active?: boolean;
  maxMembers?: number;
  defaultCoachId?: string | null;
};

type UpdateTrainingProgramRequestBody = CreateTrainingProgramRequestBody;

@Controller('training-programs')
export class TrainingProgramsController {
  constructor(
    private readonly authService: AuthService,
    private readonly trainingProgramsService: TrainingProgramsService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get()
  async listPrograms(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return {
      programs: await this.trainingProgramsService.listProgramsForTenant(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  @Post()
  async createProgram(
    @Req() request: Request,
    @Body() body: CreateTrainingProgramRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return {
      program: await this.trainingProgramsService.createProgram(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Get(':programId')
  async getProgram(
    @Req() request: Request,
    @Param('programId') programId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      program: await this.trainingProgramsService.getProgramForTenant(
        session.user.tenant.id,
        programId,
      ),
    };
  }

  @Patch(':programId')
  async updateProgram(
    @Req() request: Request,
    @Param('programId') programId: string,
    @Body() body: UpdateTrainingProgramRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return {
      program: await this.trainingProgramsService.updateProgram(
        session.user.tenant.id,
        programId,
        body,
      ),
    };
  }

  @Get('plans/:planId/entitled-programs')
  async getEntitledPrograms(
    @Req() request: Request,
    @Param('planId') planId: string,
  ) {
    await this.getRequiredSession(request.headers.cookie);
    return {
      programIds:
        await this.trainingProgramsService.listEntitledProgramIds(planId),
    };
  }

  @Patch('plans/:planId/entitled-programs')
  async setEntitledPrograms(
    @Req() request: Request,
    @Param('planId') planId: string,
    @Body() body: { programIds?: string[] },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return {
      programIds: await this.trainingProgramsService.setEntitledPrograms(
        session.user.tenant.id,
        planId,
        body.programIds ?? [],
      ),
    };
  }

  @Get(':programId/members')
  async getEnrolledMembers(
    @Req() request: Request,
    @Param('programId') programId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      memberIds: await this.trainingProgramsService.listEnrolledMemberIds(
        session.user.tenant.id,
        programId,
      ),
    };
  }

  @Patch(':programId/members')
  async setEnrolledMembers(
    @Req() request: Request,
    @Param('programId') programId: string,
    @Body() body: { memberIds?: string[] },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return {
      memberIds: await this.trainingProgramsService.setEnrolledMembers(
        session.user.tenant.id,
        programId,
        body.memberIds ?? [],
      ),
    };
  }

  private async getRequiredSession(cookieHeader: string | undefined) {
    const session =
      await this.authService.getCurrentSessionFromCookieHeader(cookieHeader);
    if (!session) throw new UnauthorizedException('Authentication required.');
    return session;
  }
}
