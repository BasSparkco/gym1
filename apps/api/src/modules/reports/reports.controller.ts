import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly authService: AuthService,
    private readonly reportsService: ReportsService,
  ) {}

  @Get('dashboard-summary')
  async getDashboardSummary(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return this.reportsService.getDashboardSummary(session.user);
  }

  @Get('active-memberships')
  async getActiveMemberships(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return this.reportsService.getActiveMembershipsReport(session.user);
  }

  @Get('expired-memberships')
  async getExpiredMemberships(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return this.reportsService.getExpiredMembershipsReport(session.user);
  }

  @Get('visits')
  async getVisits(
    @Req() request: Request,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return this.reportsService.getVisitsReport(session.user, dateFrom, dateTo);
  }

  @Get('payments')
  async getPayments(
    @Req() request: Request,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return this.reportsService.getPaymentsReport(
      session.user,
      dateFrom,
      dateTo,
    );
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
