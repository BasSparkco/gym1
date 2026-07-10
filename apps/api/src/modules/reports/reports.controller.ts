import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { AuthService } from '../auth/auth.service';
import type { SessionUser } from '../auth/auth.service';
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
    const session = await this.getRequiredSession(request.headers.cookie, ['owner', 'manager']);
    return this.reportsService.getActiveMembershipsReport(session.user);
  }

  @Get('expired-memberships')
  async getExpiredMemberships(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie, ['owner', 'manager']);
    return this.reportsService.getExpiredMembershipsReport(session.user);
  }

  @Get('visits')
  async getVisits(
    @Req() request: Request,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie, ['owner', 'manager']);
    return this.reportsService.getVisitsReport(session.user, dateFrom, dateTo);
  }

  @Get('payments')
  async getPayments(
    @Req() request: Request,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie, ['owner', 'manager']);
    return this.reportsService.getPaymentsReport(
      session.user,
      dateFrom,
      dateTo,
    );
  }

  @Get('members-by-sex')
  async getMembersBySex(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie, ['owner', 'manager']);
    return this.reportsService.getMembersBySexReport(session.user);
  }

  @Get('registrations-by-employee')
  async getRegistrationsByEmployee(
    @Req() request: Request,
    @Query('employeeId') employeeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie, ['owner', 'manager']);
    return this.reportsService.getRegistrationsByEmployeeReport(
      session.user,
      employeeId,
      dateFrom,
      dateTo,
    );
  }

  @Get('plan-performance')
  async getPlanPerformance(
    @Req() request: Request,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie, ['owner', 'manager']);
    return this.reportsService.getPlanPerformanceReport(
      session.user,
      dateFrom,
      dateTo,
    );
  }

  @Get('membership-status-breakdown')
  async getMembershipStatusBreakdown(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie, ['owner', 'manager']);
    return this.reportsService.getMembershipStatusBreakdownReport(
      session.user,
    );
  }

  @Get('expiring-soon')
  async getExpiringSoon(
    @Req() request: Request,
    @Query('days') days?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie, ['owner', 'manager']);
    return this.reportsService.getExpiringSoonReport(
      session.user,
      days ? Number(days) : undefined,
    );
  }

  @Get('upcoming-birthdays')
  async getUpcomingBirthdays(
    @Req() request: Request,
    @Query('days') days?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie, ['owner', 'manager']);
    return this.reportsService.getUpcomingBirthdaysReport(
      session.user,
      days ? Number(days) : undefined,
    );
  }

  @Get('new-members-growth')
  async getNewMembersGrowth(
    @Req() request: Request,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie, ['owner', 'manager']);
    return this.reportsService.getNewMembersGrowthReport(
      session.user,
      dateFrom,
      dateTo,
    );
  }

  private async getRequiredSession(
    cookieHeader: string | undefined,
    roles?: Array<SessionUser['role']>,
  ) {
    const session =
      await this.authService.getCurrentSessionFromCookieHeader(cookieHeader);

    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }

    if (roles) {
      requireRole(session.user, roles);
    }

    return session;
  }
}
