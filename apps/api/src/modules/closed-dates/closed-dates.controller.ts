import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { DataScopeService } from '../../common/data-scope.service';
import { AuthService } from '../auth/auth.service';
import { ClosedDatesService } from './closed-dates.service';

type CreateClosedDateRequestBody = {
  branchId?: string;
  date?: string;
  reason?: string;
};

@Controller('closed-dates')
export class ClosedDatesController {
  constructor(
    private readonly authService: AuthService,
    private readonly closedDatesService: ClosedDatesService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get()
  async listClosedDates(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const scopedBranchId = await this.dataScopeService.resolveBranchId(
      session.user,
    );

    return {
      closedDates: await this.closedDatesService.listForTenant(
        session.user.tenant.id,
        scopedBranchId,
      ),
    };
  }

  @Post()
  async createClosedDate(
    @Req() request: Request,
    @Body() body: CreateClosedDateRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      closedDate: await this.closedDatesService.create(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Delete(':closedDateId')
  @HttpCode(200)
  async deleteClosedDate(
    @Req() request: Request,
    @Param('closedDateId') closedDateId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    await this.closedDatesService.delete(session.user.tenant.id, closedDateId);
    return { deleted: true };
  }

  private async getRequiredSession(cookieHeader: string | undefined) {
    const session =
      await this.authService.getCurrentSessionFromCookieHeader(cookieHeader);

    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }

    return session;
  }
}
