import { Injectable } from '@nestjs/common';
import { SessionUser } from '../auth/auth.service';
import { localDateString, toDateOnlyString } from '../../common/date';
import { toNumber } from '../../common/decimal';
import { DataScopeService } from '../../common/data-scope.service';
import { MembersService } from '../members/members.service';
import { MembershipsService } from '../memberships/memberships.service';
import { PaymentsService } from '../payments/payments.service';
import { VisitsService } from '../visits/visits.service';
import { PrismaService } from '../../prisma/prisma.service';

type DashboardCard = {
  id:
    | 'active-memberships'
    | 'expiring-memberships'
    | 'today-check-ins'
    | 'payments-logged';
  label: string;
  value: string;
  tone: 'bg-white' | 'bg-surface-muted';
  helperText: string;
};

const quickActionsByRole: Record<SessionUser['role'], string[]> = {
  owner: [
    'Create member',
    'Sell membership',
    'Record payment',
    'Check in member',
  ],
  manager: [
    'Create member',
    'Sell membership',
    'Record payment',
    'Check in member',
  ],
  'front-desk': ['Create member', 'Record payment', 'Check in member'],
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membersService: MembersService,
    private readonly membershipsService: MembershipsService,
    private readonly paymentsService: PaymentsService,
    private readonly visitsService: VisitsService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  async getDashboardSummary(user: SessionUser) {
    const reportDate = this.membersService.getReportingDate();
    const reportDateEnd = this.addDays(reportDate, 7);
    const branchId = await this.dataScopeService.resolveBranchId(user);

    // Active memberships: tenant-wide by default, narrowed to the owner's
    // active branch when they've opted into that view (matches members page logic)
    const allTenantMemberships =
      await this.membershipsService.listMembershipsForTenant(
        user.tenant.id,
        branchId,
      );
    const activeMemberships = allTenantMemberships.filter(
      (m) => m.status === 'active',
    );
    const expiringMemberships = activeMemberships.filter((m) => {
      return m.endDate >= reportDate && m.endDate <= reportDateEnd;
    });

    // Check-ins and payments are branch-scoped (branch-level operations)
    const visitsToday = (
      await this.visitsService.listVisitsForScope(user.tenant.id, branchId)
    ).filter((visit) => this.toDateKey(visit.checkInTime) === reportDate);

    const paidPaymentsToday = (
      await this.paymentsService.listPaymentsForScope(user.tenant.id, branchId)
    ).filter(
      (payment) =>
        payment.status === 'paid' &&
        this.toDateKey(payment.paymentDate) === reportDate,
    );

    const paymentTotal = paidPaymentsToday.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    const currencyCode = await this.dataScopeService.resolveCurrencyCode(
      user,
      branchId,
    );

    const cards: DashboardCard[] = [
      {
        id: 'active-memberships',
        label: 'Active memberships',
        value: String(activeMemberships.length),
        tone: 'bg-white',
        helperText: `${activeMemberships.length} memberships currently active.`,
      },
      {
        id: 'expiring-memberships',
        label: 'Expiring this week',
        value: String(expiringMemberships.length),
        tone: 'bg-surface-muted',
        helperText: `${expiringMemberships.length} active memberships expire by ${this.formatDate(reportDateEnd)}.`,
      },
      {
        id: 'today-check-ins',
        label: "Today's check-ins",
        value: String(visitsToday.length),
        tone: 'bg-white',
        helperText: branchId
          ? `${visitsToday.length} visits logged at ${user.branch.name} today.`
          : `${visitsToday.length} visits logged across all branches today.`,
      },
      {
        id: 'payments-logged',
        label: 'Payments today',
        value: this.formatCurrency(paymentTotal, currencyCode),
        tone: 'bg-surface-muted',
        helperText: branchId
          ? `${paidPaymentsToday.length} paid transactions at ${user.branch.name}.`
          : `${paidPaymentsToday.length} paid transactions across all branches.`,
      },
    ];

    return {
      cards,
      quickActions: quickActionsByRole[user.role],
      scope: {
        tenantId: user.tenant.id,
        tenantName: user.tenant.name,
        branchId: user.branch.id,
        branchName: user.branch.name,
        role: user.role,
        asOfDate: reportDate,
        allBranches: !branchId,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getActiveMembershipsReport(user: SessionUser) {
    const today = this.membersService.getReportingDate();
    const todayDate = new Date(today);
    const branchId = await this.dataScopeService.resolveBranchId(user);

    const memberships = await this.prisma.membership.findMany({
      where: {
        member: {
          tenantId: user.tenant.id,
          ...(branchId ? { homeBranchId: branchId } : {}),
        },
        status: 'active',
        startDate: { lte: todayDate },
        endDate: { gte: todayDate },
      },
      include: { member: true, plan: true },
      orderBy: { endDate: 'asc' },
    });

    const rows = memberships.map((ms) => ({
      membershipId: ms.id,
      memberId: ms.memberId,
      memberName: ms.member?.fullName ?? null,
      memberNumber: ms.member?.memberNumber ?? null,
      planName: ms.plan?.name ?? null,
      startDate: toDateOnlyString(ms.startDate),
      endDate: toDateOnlyString(ms.endDate),
      finalPrice: toNumber(ms.finalPrice),
      status: ms.status,
    }));

    const currency = await this.dataScopeService.resolveCurrencyCode(
      user,
      branchId,
    );

    return { rows, total: rows.length, asOfDate: today, currency };
  }

  async getExpiredMembershipsReport(user: SessionUser) {
    const today = this.membersService.getReportingDate();
    const todayDate = new Date(today);
    const branchId = await this.dataScopeService.resolveBranchId(user);

    const memberships = await this.prisma.membership.findMany({
      where: {
        member: {
          tenantId: user.tenant.id,
          ...(branchId ? { homeBranchId: branchId } : {}),
        },
        OR: [{ status: 'expired' }, { endDate: { lt: todayDate } }],
      },
      include: { member: true, plan: true },
      orderBy: { endDate: 'desc' },
    });

    const rows = memberships.map((ms) => ({
      membershipId: ms.id,
      memberId: ms.memberId,
      memberName: ms.member?.fullName ?? null,
      memberNumber: ms.member?.memberNumber ?? null,
      planName: ms.plan?.name ?? null,
      startDate: toDateOnlyString(ms.startDate),
      endDate: toDateOnlyString(ms.endDate),
      finalPrice: toNumber(ms.finalPrice),
      status: ms.status,
    }));

    const currency = await this.dataScopeService.resolveCurrencyCode(
      user,
      branchId,
    );

    return { rows, total: rows.length, asOfDate: today, currency };
  }

  async getVisitsReport(user: SessionUser, dateFrom?: string, dateTo?: string) {
    const today = this.membersService.getReportingDate();
    const from = dateFrom ?? today;
    const to = dateTo ?? today;
    const branchId = await this.dataScopeService.resolveBranchId(user);

    const visits = await this.prisma.visit.findMany({
      where: {
        member: { tenantId: user.tenant.id },
        ...(branchId ? { branchId } : {}),
        checkInTime: this.utcDayRange(from, to),
      },
      include: { member: true },
      orderBy: { checkInTime: 'desc' },
    });

    const rows = visits.map((v) => ({
      visitId: v.id,
      memberId: v.memberId,
      memberName: v.member?.fullName ?? null,
      memberNumber: v.member?.memberNumber ?? null,
      branchId: v.branchId,
      checkInTime: v.checkInTime.toISOString(),
      accessMethod: v.accessMethod,
    }));

    return { rows, total: rows.length, dateFrom: from, dateTo: to };
  }

  async getPaymentsReport(
    user: SessionUser,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const today = this.membersService.getReportingDate();
    const from = dateFrom ?? today;
    const to = dateTo ?? today;
    const branchId = await this.dataScopeService.resolveBranchId(user);

    const payments = await this.prisma.payment.findMany({
      where: {
        tenantId: user.tenant.id,
        ...(branchId ? { branchId } : {}),
        paymentDate: this.utcDayRange(from, to),
      },
      include: { member: true },
      orderBy: { paymentDate: 'desc' },
    });

    const rows = payments.map((p) => ({
      paymentId: p.id,
      memberId: p.memberId,
      memberName: p.member?.fullName ?? null,
      memberNumber: p.member?.memberNumber ?? null,
      membershipId: p.membershipId,
      amount: toNumber(p.amount),
      paymentDate: p.paymentDate.toISOString(),
      status: p.status,
      paymentMethod: p.paymentMethod,
    }));

    const totalPaid = rows
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);

    const currency = await this.dataScopeService.resolveCurrencyCode(
      user,
      branchId,
    );

    return {
      rows,
      total: rows.length,
      totalPaid,
      dateFrom: from,
      dateTo: to,
      currency,
    };
  }

  // Inclusive [from, to] range of "YYYY-MM-DD" strings, expressed as a UTC
  // timestamp range — matches the original's `checkInTime.slice(0, 10)`
  // string-prefix comparison against date-only cutoffs.
  private utcDayRange(from: string, to: string): { gte: Date; lt: Date } {
    const gte = new Date(`${from}T00:00:00.000Z`);
    const lt = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000);
    return { gte, lt };
  }

  private addDays(dateKey: string, days: number) {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private toDateKey(dateTime: Date | string) {
    return localDateString(new Date(dateTime));
  }

  private formatDate(dateKey: string) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${dateKey}T00:00:00.000Z`));
  }

  private formatCurrency(value: number, currencyCode: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
