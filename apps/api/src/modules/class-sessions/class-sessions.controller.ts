import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { DataScopeService } from '../../common/data-scope.service';
import { AuthService } from '../auth/auth.service';
import { ClassSessionsService } from './class-sessions.service';
import type {
  CreateClassSessionInput,
  CreateRecurringClassSessionsInput,
  UpdateClassSessionInput,
} from './class-sessions.service';

@Controller('class-sessions')
export class ClassSessionsController {
  constructor(
    private readonly authService: AuthService,
    private readonly classSessionsService: ClassSessionsService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get()
  async listSessions(
    @Req() request: Request,
    @Query('programId') programId?: string,
    @Query('coachId') coachId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return {
      classSessions: await this.classSessionsService.listSessionsForTenant(
        session.user.tenant.id,
        branchId,
        { programId, coachId, from, to },
      ),
    };
  }

  @Post()
  async createSession(
    @Req() request: Request,
    @Body() body: CreateClassSessionInput,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return {
      classSession: await this.classSessionsService.createSession(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Post('recurring')
  async createRecurringSessions(
    @Req() request: Request,
    @Body() body: CreateRecurringClassSessionsInput,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return this.classSessionsService.createRecurringSessions(
      session.user.tenant.id,
      body,
    );
  }

  @Get(':sessionId')
  async getSession(
    @Req() request: Request,
    @Param('sessionId') sessionId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      classSession: await this.classSessionsService.getSessionForTenant(
        session.user.tenant.id,
        sessionId,
      ),
    };
  }

  @Patch(':sessionId')
  async updateSession(
    @Req() request: Request,
    @Param('sessionId') sessionId: string,
    @Body() body: UpdateClassSessionInput,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return {
      classSession: await this.classSessionsService.updateSession(
        session.user.tenant.id,
        sessionId,
        body,
      ),
    };
  }

  @Post(':sessionId/cancel')
  async cancelSession(
    @Req() request: Request,
    @Param('sessionId') sessionId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return {
      classSession: await this.classSessionsService.cancelSession(
        session.user.tenant.id,
        sessionId,
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
