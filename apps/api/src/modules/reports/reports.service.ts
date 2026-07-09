import { Injectable } from '@nestjs/common';
import { SessionUser } from '../auth/auth.service';
import { localDateString, toDateOnlyString } from '../../common/date';
import { toNumber } from '../../common/decimal';
import { DataScopeService } from '../../common/data-scope.service';
import { MembersService } from '../members/members.service';
import { MembershipsService } from '../memberships/memberships.service';
import { PaymentsService } from '../payments/payments.service';
import { VisitsService } from '../visits/visits.service';
import { EmployeesService } from '../employees/employees.service';
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
    private readonly employeesService: EmployeesService,
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

  async getMembersBySexReport(user: SessionUser) {
    const today = this.membersService.getReportingDate();
    const branchId = await this.dataScopeService.resolveBranchId(user);

    const members = await this.prisma.member.findMany({
      where: {
        tenantId: user.tenant.id,
        ...(branchId ? { homeBranchId: branchId } : {}),
      },
      select: { id: true, sex: true },
    });

    const activeIds = await this.buildActiveMemberIdSet(user.tenant.id);

    const buckets: Record<'male' | 'female' | 'unspecified', { total: number; active: number }> = {
      male: { total: 0, active: 0 },
      female: { total: 0, active: 0 },
      unspecified: { total: 0, active: 0 },
    };

    for (const member of members) {
      const key = member.sex ?? 'unspecified';
      buckets[key].total += 1;
      if (activeIds.has(member.id)) buckets[key].active += 1;
    }

    const rows = (['male', 'female', 'unspecified'] as const).map((sex) => ({
      sex,
      total: buckets[sex].total,
      active: buckets[sex].active,
    }));

    return {
      rows,
      total: members.length,
      activeTotal: activeIds.size,
      asOfDate: today,
    };
  }

  async getRegistrationsByEmployeeReport(
    user: SessionUser,
    employeeId?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const branchId = await this.dataScopeService.resolveBranchId(user);
    const range = this.optionalDayRange(dateFrom, dateTo);

    const members = await this.prisma.member.findMany({
      where: {
        tenantId: user.tenant.id,
        ...(branchId ? { homeBranchId: branchId } : {}),
        ...(employeeId ? { registeredEmployeeId: employeeId } : {}),
        ...(range ? { joinDate: range } : {}),
      },
      include: { registeredEmployee: true },
      orderBy: { joinDate: 'desc' },
    });

    if (employeeId) {
      const employee = await this.employeesService.getEmployeeForTenant(
        user.tenant.id,
        employeeId,
      );
      const rows = members.map((m) => ({
        memberId: m.id,
        memberName: m.fullName,
        memberNumber: m.memberNumber,
        joinDate: m.joinDate ? toDateOnlyString(m.joinDate) : null,
        sex: m.sex,
      }));

      return {
        kind: 'detail' as const,
        employeeId,
        employeeName: employee?.fullName ?? null,
        rows,
        total: rows.length,
        dateFrom: dateFrom ?? null,
        dateTo: dateTo ?? null,
      };
    }

    const counts = new Map<string, { employeeId: string; employeeName: string; employeeNumber: string; count: number }>();
    let unassigned = 0;

    for (const member of members) {
      if (!member.registeredEmployee) {
        unassigned += 1;
        continue;
      }
      const existing = counts.get(member.registeredEmployee.id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(member.registeredEmployee.id, {
          employeeId: member.registeredEmployee.id,
          employeeName: member.registeredEmployee.fullName,
          employeeNumber: member.registeredEmployee.employeeNumber,
          count: 1,
        });
      }
    }

    const rows = Array.from(counts.values()).sort((a, b) => b.count - a.count);

    return {
      kind: 'summary' as const,
      rows,
      unassignedCount: unassigned,
      total: members.length,
      dateFrom: dateFrom ?? null,
      dateTo: dateTo ?? null,
    };
  }

  async getPlanPerformanceReport(user: SessionUser, dateFrom?: string, dateTo?: string) {
    const today = this.membersService.getReportingDate();
    const from = dateFrom ?? this.firstOfMonth(today);
    const to = dateTo ?? today;
    const branchId = await this.dataScopeService.resolveBranchId(user);

    const memberships = await this.prisma.membership.findMany({
      where: {
        member: {
          tenantId: user.tenant.id,
          ...(branchId ? { homeBranchId: branchId } : {}),
        },
        startDate: this.utcDayRange(from, to),
      },
      include: { plan: true },
    });

    const byPlan = new Map<
      string,
      { planId: string; planName: string; planType: string; count: number; revenue: number }
    >();

    for (const ms of memberships) {
      const existing = byPlan.get(ms.planId);
      const revenue = toNumber(ms.finalPrice);
      if (existing) {
        existing.count += 1;
        existing.revenue += revenue;
      } else {
        byPlan.set(ms.planId, {
          planId: ms.planId,
          planName: ms.plan?.name ?? '—',
          planType: ms.plan?.planType ?? 'duration',
          count: 1,
          revenue,
        });
      }
    }

    const rows = Array.from(byPlan.values()).sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);

    const currency = await this.dataScopeService.resolveCurrencyCode(user, branchId);

    return {
      rows,
      total: memberships.length,
      totalRevenue,
      dateFrom: from,
      dateTo: to,
      currency,
    };
  }

  async getMembershipStatusBreakdownReport(user: SessionUser) {
    const today = this.membersService.getReportingDate();
    const branchId = await this.dataScopeService.resolveBranchId(user);

    const memberships = await this.membershipsService.listMembershipsForTenant(
      user.tenant.id,
      branchId,
    );

    const counts = new Map<string, number>();
    for (const ms of memberships) {
      counts.set(ms.status, (counts.get(ms.status) ?? 0) + 1);
    }

    const statusOrder = ['active', 'frozen', 'expired', 'cancelled', 'draft'];
    const rows = statusOrder
      .filter((status) => counts.has(status))
      .map((status) => ({ status, count: counts.get(status) ?? 0 }));

    return { rows, total: memberships.length, asOfDate: today };
  }

  async getExpiringSoonReport(user: SessionUser, days?: number) {
    const today = this.membersService.getReportingDate();
    const windowDays = days ?? 7;
    const cutoff = this.addDays(today, windowDays);
    const todayDate = new Date(today);
    const cutoffDate = new Date(cutoff);
    const branchId = await this.dataScopeService.resolveBranchId(user);

    const memberships = await this.prisma.membership.findMany({
      where: {
        member: {
          tenantId: user.tenant.id,
          ...(branchId ? { homeBranchId: branchId } : {}),
        },
        status: { in: ['active', 'frozen'] },
        endDate: { gte: todayDate, lte: cutoffDate },
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
      endDate: toDateOnlyString(ms.endDate),
      finalPrice: toNumber(ms.finalPrice),
      status: ms.status,
    }));

    const currency = await this.dataScopeService.resolveCurrencyCode(user, branchId);

    return { rows, total: rows.length, asOfDate: today, days: windowDays, currency };
  }

  async getUpcomingBirthdaysReport(user: SessionUser, days?: number) {
    const today = this.membersService.getReportingDate();
    const windowDays = days ?? 30;
    const branchId = await this.dataScopeService.resolveBranchId(user);

    const members = await this.prisma.member.findMany({
      where: {
        tenantId: user.tenant.id,
        ...(branchId ? { homeBranchId: branchId } : {}),
        dateOfBirth: { not: null },
      },
      select: {
        id: true,
        fullName: true,
        memberNumber: true,
        dateOfBirth: true,
        phone: true,
      },
    });

    const todayDate = new Date(`${today}T00:00:00.000Z`);
    const rows = members
      .map((m) => {
        const nextBirthday = this.nextOccurrence(m.dateOfBirth!, todayDate);
        const daysUntil = Math.round(
          (nextBirthday.getTime() - todayDate.getTime()) / (24 * 60 * 60 * 1000),
        );
        return {
          memberId: m.id,
          memberName: m.fullName,
          memberNumber: m.memberNumber,
          phone: m.phone,
          dateOfBirth: toDateOnlyString(m.dateOfBirth!),
          nextBirthday: nextBirthday.toISOString().slice(0, 10),
          daysUntil,
        };
      })
      .filter((row) => row.daysUntil <= windowDays)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return { rows, total: rows.length, asOfDate: today, days: windowDays };
  }

  async getNewMembersGrowthReport(user: SessionUser, dateFrom?: string, dateTo?: string) {
    const today = this.membersService.getReportingDate();
    const from = dateFrom ?? this.firstOfMonth(today);
    const to = dateTo ?? today;
    const branchId = await this.dataScopeService.resolveBranchId(user);

    const members = await this.prisma.member.findMany({
      where: {
        tenantId: user.tenant.id,
        ...(branchId ? { homeBranchId: branchId } : {}),
        joinDate: this.utcDayRange(from, to),
      },
      select: { joinDate: true },
      orderBy: { joinDate: 'asc' },
    });

    const counts = new Map<string, number>();
    for (const m of members) {
      const key = m.joinDate ? toDateOnlyString(m.joinDate)! : 'unknown';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const rows = Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { rows, total: members.length, dateFrom: from, dateTo: to };
  }

  private async buildActiveMemberIdSet(tenantId: string): Promise<Set<string>> {
    const today = new Date(this.membersService.getReportingDate());
    const activeMemberships = await this.prisma.membership.findMany({
      where: {
        member: { tenantId },
        status: { in: ['active', 'frozen'] },
        endDate: { gte: today },
      },
      select: { memberId: true },
    });
    return new Set(activeMemberships.map((m) => m.memberId));
  }

  // Returns the next occurrence (this year or next) of the given birth date's
  // month/day, at or after `fromDate` — used to sort members by "days until
  // birthday" regardless of birth year.
  private nextOccurrence(birthDate: Date, fromDate: Date): Date {
    const month = birthDate.getUTCMonth();
    const day = birthDate.getUTCDate();
    let candidate = new Date(Date.UTC(fromDate.getUTCFullYear(), month, day));
    if (candidate.getTime() < fromDate.getTime()) {
      candidate = new Date(Date.UTC(fromDate.getUTCFullYear() + 1, month, day));
    }
    return candidate;
  }

  private firstOfMonth(dateKey: string): string {
    return `${dateKey.slice(0, 7)}-01`;
  }

  // Inclusive [from, to] range of "YYYY-MM-DD" strings, expressed as a UTC
  // timestamp range — matches the original's `checkInTime.slice(0, 10)`
  // string-prefix comparison against date-only cutoffs.
  private utcDayRange(from: string, to: string): { gte: Date; lt: Date } {
    const gte = new Date(`${from}T00:00:00.000Z`);
    const lt = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000);
    return { gte, lt };
  }

  // Like utcDayRange, but returns an open-ended (or fully unbounded) range
  // when one or both cutoffs are omitted, for reports with optional filters.
  private optionalDayRange(
    from?: string,
    to?: string,
  ): { gte?: Date; lt?: Date } | undefined {
    if (!from && !to) return undefined;
    const range: { gte?: Date; lt?: Date } = {};
    if (from) range.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) range.lt = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000);
    return range;
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
