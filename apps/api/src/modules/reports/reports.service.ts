import { Injectable } from '@nestjs/common';
import { SessionUser } from '../auth/auth.service';
import { readOperationsStore } from '../../data/operations-store';
import { MembersService } from '../members/members.service';
import { MembershipsService } from '../memberships/memberships.service';
import { PaymentsService } from '../payments/payments.service';
import { VisitsService } from '../visits/visits.service';

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
    private readonly membersService: MembersService,
    private readonly membershipsService: MembershipsService,
    private readonly paymentsService: PaymentsService,
    private readonly visitsService: VisitsService,
  ) {}

  getDashboardSummary(user: SessionUser) {
    const reportDate = this.membersService.getReportingDate();
    const reportDateEnd = this.addDays(reportDate, 7);

    // Active memberships: tenant-wide, status-only (matches members page logic)
    const allTenantMemberships =
      this.membershipsService.listMembershipsForTenant(user.tenant.id);
    const activeMemberships = allTenantMemberships.filter(
      (m) => m.status === 'active',
    );
    const expiringMemberships = activeMemberships.filter((m) => {
      return m.endDate >= reportDate && m.endDate <= reportDateEnd;
    });

    // Check-ins and payments are branch-scoped (branch-level operations)
    const visitsToday = this.visitsService
      .listVisitsForScope(user.tenant.id, user.branch.id)
      .filter((visit) => this.toDateKey(visit.checkInTime) === reportDate);

    const paidPaymentsToday = this.paymentsService
      .listPaymentsForScope(user.tenant.id, user.branch.id)
      .filter(
        (payment) =>
          payment.status === 'paid' &&
          this.toDateKey(payment.paymentDate) === reportDate,
      );

    const paymentTotal = paidPaymentsToday.reduce(
      (sum, payment) => sum + payment.amount,
      0,
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
        helperText: `${visitsToday.length} visits logged at ${user.branch.name} today.`,
      },
      {
        id: 'payments-logged',
        label: 'Payments today',
        value: this.formatCurrency(paymentTotal),
        tone: 'bg-surface-muted',
        helperText: `${paidPaymentsToday.length} paid transactions at ${user.branch.name}.`,
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
      },
      generatedAt: new Date().toISOString(),
    };
  }

  getActiveMembershipsReport(user: SessionUser) {
    const store = readOperationsStore();
    const today = this.membersService.getReportingDate();
    const memberIds = new Set(
      store.members
        .filter((m) => m.tenantId === user.tenant.id && m.status === 'active')
        .map((m) => m.id),
    );

    const rows = store.memberships
      .filter(
        (ms) =>
          memberIds.has(ms.memberId) &&
          ms.status === 'active' &&
          ms.startDate <= today &&
          ms.endDate >= today,
      )
      .map((ms) => {
        const member = store.members.find((m) => m.id === ms.memberId);
        const plan = store.membershipPlans.find((p) => p.id === ms.planId);
        return {
          membershipId: ms.id,
          memberId: ms.memberId,
          memberName: member?.fullName ?? null,
          memberNumber: member?.memberNumber ?? null,
          planName: plan?.name ?? null,
          startDate: ms.startDate,
          endDate: ms.endDate,
          finalPrice: ms.finalPrice,
          status: ms.status,
        };
      })
      .sort((a, b) => a.endDate.localeCompare(b.endDate));

    return { rows, total: rows.length, asOfDate: today };
  }

  getExpiredMembershipsReport(user: SessionUser) {
    const store = readOperationsStore();
    const today = this.membersService.getReportingDate();
    const memberIds = new Set(
      store.members
        .filter((m) => m.tenantId === user.tenant.id)
        .map((m) => m.id),
    );

    const rows = store.memberships
      .filter(
        (ms) =>
          memberIds.has(ms.memberId) &&
          (ms.status === 'expired' || ms.endDate < today),
      )
      .map((ms) => {
        const member = store.members.find((m) => m.id === ms.memberId);
        const plan = store.membershipPlans.find((p) => p.id === ms.planId);
        return {
          membershipId: ms.id,
          memberId: ms.memberId,
          memberName: member?.fullName ?? null,
          memberNumber: member?.memberNumber ?? null,
          planName: plan?.name ?? null,
          startDate: ms.startDate,
          endDate: ms.endDate,
          finalPrice: ms.finalPrice,
          status: ms.status,
        };
      })
      .sort((a, b) => b.endDate.localeCompare(a.endDate));

    return { rows, total: rows.length, asOfDate: today };
  }

  getVisitsReport(user: SessionUser, dateFrom?: string, dateTo?: string) {
    const store = readOperationsStore();
    const today = this.membersService.getReportingDate();
    const from = dateFrom ?? today;
    const to = dateTo ?? today;
    const memberIds = new Set(
      store.members
        .filter((m) => m.tenantId === user.tenant.id)
        .map((m) => m.id),
    );

    const rows = store.visits
      .filter((v) => {
        if (!memberIds.has(v.memberId)) return false;
        if (v.branchId !== user.branch.id) return false;
        const dateKey = v.checkInTime.slice(0, 10);
        return dateKey >= from && dateKey <= to;
      })
      .map((v) => {
        const member = store.members.find((m) => m.id === v.memberId);
        return {
          visitId: v.id,
          memberId: v.memberId,
          memberName: member?.fullName ?? null,
          memberNumber: member?.memberNumber ?? null,
          branchId: v.branchId,
          checkInTime: v.checkInTime,
          accessMethod: v.accessMethod,
        };
      })
      .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime));

    return { rows, total: rows.length, dateFrom: from, dateTo: to };
  }

  getPaymentsReport(user: SessionUser, dateFrom?: string, dateTo?: string) {
    const store = readOperationsStore();
    const today = this.membersService.getReportingDate();
    const from = dateFrom ?? today;
    const to = dateTo ?? today;

    const rows = store.payments
      .filter((p) => {
        if (p.tenantId !== user.tenant.id) return false;
        if (p.branchId !== user.branch.id) return false;
        const dateKey = p.paymentDate.slice(0, 10);
        return dateKey >= from && dateKey <= to;
      })
      .map((p) => {
        const member = store.members.find((m) => m.id === p.memberId);
        return {
          paymentId: p.id,
          memberId: p.memberId,
          memberName: member?.fullName ?? null,
          memberNumber: member?.memberNumber ?? null,
          membershipId: p.membershipId,
          amount: p.amount,
          paymentDate: p.paymentDate,
          status: p.status,
          paymentMethod: p.paymentMethod,
        };
      })
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

    const totalPaid = rows
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);

    return { rows, total: rows.length, totalPaid, dateFrom: from, dateTo: to };
  }

  private addDays(dateKey: string, days: number) {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private toDateKey(dateTime: string) {
    return new Date(dateTime).toISOString().slice(0, 10);
  }

  private formatDate(dateKey: string) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${dateKey}T00:00:00.000Z`));
  }

  private formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
