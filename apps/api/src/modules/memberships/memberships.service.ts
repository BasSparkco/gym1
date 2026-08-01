import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { addDays, localDateString, toDateOnlyString } from '../../common/date';
import { toNumber } from '../../common/decimal';
import { makeQrPublicUrl } from '../../common/qr';
import { BasIpSyncService } from '../access/bas-ip-sync.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DebtService } from '../debt/debt.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Freeze,
  Member,
  Membership,
  MembershipPlan,
  MembershipStatus,
} from '../../generated/prisma/client';

type CreateMembershipPlanInput = {
  name?: string;
  planType?: 'duration' | 'session';
  durationDays?: number;
  sessionCount?: number;
  price?: number;
  allowAllBranches?: boolean;
  freezeAllowed?: boolean;
  freezeMaxDays?: number;
  allowAllPrograms?: boolean;
};

type UpdateMembershipPlanInput = {
  name?: string;
  planType?: 'duration' | 'session';
  durationDays?: number;
  sessionCount?: number;
  price?: number;
  allowAllBranches?: boolean;
  freezeAllowed?: boolean;
  freezeMaxDays?: number;
  allowAllPrograms?: boolean;
};

type CreateMembershipInput = {
  memberId?: string;
  planId?: string;
  startDate?: string;
  endDate?: string;
  status?: MembershipStatus;
  finalPrice?: number;
};

type UpdateMembershipInput = {
  status?: MembershipStatus;
  startDate?: string;
  endDate?: string;
  finalPrice?: number;
};

const validMembershipStatuses = new Set<MembershipStatus>([
  'draft',
  'active',
  'frozen',
  'expired',
  'cancelled',
]);

function toDateOnly(dateStr: string): Date {
  return new Date(dateStr);
}

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly basIpSyncService: BasIpSyncService,
    private readonly debtService: DebtService,
  ) {}

  /**
   * Keeps membership status in sync with the calendar: expires actives past
   * their end date, and activates pre-sold drafts whose start date has
   * arrived. A draft's date range never overlaps an active one (enforced at
   * creation in `createMembership`), so by the time a draft is due its
   * predecessor has always already expired — activation here can't collide.
   */
  private async autoExpireStaleForTenant(tenantId: string): Promise<void> {
    const today = toDateOnly(localDateString());
    await this.prisma.membership.updateMany({
      where: { member: { tenantId }, status: 'active', endDate: { lt: today } },
      data: { status: 'expired' },
    });

    const dueDrafts = await this.prisma.membership.findMany({
      where: { member: { tenantId }, status: 'draft', startDate: { lte: today } },
      include: { member: true, plan: true },
    });

    for (const draft of dueDrafts) {
      const activated = await this.prisma.membership.update({
        where: { id: draft.id },
        data: { status: 'active' },
      });
      await this.activateMembership(tenantId, draft.member, draft.plan, activated);
      await this.debtService.recompute(draft.memberId);
    }
  }

  /** Sends the activation notification and pushes gate access for a
   * membership that just became active — on initial sale or when a pre-sold
   * draft's start date arrives. */
  private async activateMembership(
    tenantId: string,
    member: Member,
    plan: MembershipPlan,
    membership: Membership,
  ): Promise<void> {
    const qrUrl = makeQrPublicUrl(member.id);
    await this.notificationsService.createNotificationsForEvent(
      tenantId,
      'membershipActivated',
      membership.memberId,
      {
        templateKey: 'membershipActivated',
        variables: {
          planName: plan.name,
          endDate: toDateOnlyString(membership.endDate),
          qrUrl,
        },
        relatedId: membership.id,
      },
    );

    this.syncToDevice(member, membership);
  }

  async listMembershipsForTenant(tenantId: string, branchId?: string) {
    await this.autoExpireStaleForTenant(tenantId);

    const memberships = await this.prisma.membership.findMany({
      where: {
        member: { tenantId, ...(branchId ? { homeBranchId: branchId } : {}) },
        plan: { tenantId },
      },
    });
    return memberships.map((m) => this.serializeMembership(m));
  }

  async listMembershipPlansForTenant(tenantId: string) {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { tenantId },
    });
    return plans.map((p) => this.serializePlan(p));
  }

  async getMembershipPlanForTenant(tenantId: string, planId: string) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, tenantId },
    });

    if (!plan) {
      throw new NotFoundException('Membership plan not found.');
    }

    return this.serializePlan(plan);
  }

  async createMembershipPlan(tenantId: string, input: CreateMembershipPlanInput) {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException('Plan name is required.');
    }

    const planType = input.planType ?? 'duration';

    if (planType === 'duration' && !input.durationDays) {
      throw new BadRequestException(
        'Duration in days is required for duration plans.',
      );
    }

    if (planType === 'session' && !input.sessionCount) {
      throw new BadRequestException(
        'Session count is required for session plans.',
      );
    }

    const plan = await this.prisma.membershipPlan.create({
      data: {
        id: `plan-${randomUUID()}`,
        tenantId,
        name,
        planType,
        durationDays: planType === 'duration' ? input.durationDays : undefined,
        sessionCount: planType === 'session' ? input.sessionCount : undefined,
        price: input.price ?? 0,
        allowAllBranches: input.allowAllBranches ?? true,
        freezeAllowed: input.freezeAllowed ?? false,
        freezeMaxDays: input.freezeAllowed ? input.freezeMaxDays : undefined,
        allowAllPrograms: input.allowAllPrograms ?? true,
      },
    });

    return this.serializePlan(plan);
  }

  async updateMembershipPlan(
    tenantId: string,
    planId: string,
    input: UpdateMembershipPlanInput,
  ) {
    const current = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, tenantId },
    });

    if (!current) {
      throw new NotFoundException('Membership plan not found.');
    }

    const planType = input.planType ?? current.planType;
    const name = input.name === undefined ? current.name : input.name.trim();

    if (!name) {
      throw new BadRequestException('Plan name is required.');
    }

    const freezeAllowed = input.freezeAllowed ?? current.freezeAllowed;

    const plan = await this.prisma.membershipPlan.update({
      where: { id: planId },
      data: {
        name,
        planType,
        durationDays:
          planType === 'duration'
            ? (input.durationDays ??
              (current.planType === 'duration'
                ? current.durationDays
                : null))
            : null,
        sessionCount:
          planType === 'session'
            ? (input.sessionCount ??
              (current.planType === 'session' ? current.sessionCount : null))
            : null,
        price: input.price ?? current.price,
        allowAllBranches: input.allowAllBranches ?? current.allowAllBranches,
        freezeAllowed,
        freezeMaxDays: freezeAllowed
          ? (input.freezeMaxDays ?? current.freezeMaxDays)
          : null,
        allowAllPrograms: input.allowAllPrograms ?? current.allowAllPrograms,
      },
    });

    return this.serializePlan(plan);
  }

  async getMembershipForTenant(tenantId: string, membershipId: string) {
    await this.autoExpireStaleForTenant(tenantId);

    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, member: { tenantId } },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found.');
    }

    return this.serializeMembership(membership);
  }

  async updateMembership(
    tenantId: string,
    membershipId: string,
    input: UpdateMembershipInput,
  ) {
    const current = await this.prisma.membership.findFirst({
      where: { id: membershipId, member: { tenantId } },
    });

    if (!current) {
      throw new NotFoundException('Membership not found.');
    }

    if (
      input.status !== undefined &&
      !validMembershipStatuses.has(input.status)
    ) {
      throw new BadRequestException('Membership status is invalid.');
    }

    const membership = await this.prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: input.status ?? current.status,
        startDate:
          input.startDate === undefined
            ? undefined
            : toDateOnly(input.startDate),
        endDate:
          input.endDate === undefined ? undefined : toDateOnly(input.endDate),
        finalPrice: input.finalPrice ?? current.finalPrice,
      },
    });

    await this.debtService.recompute(membership.memberId);

    return this.serializeMembership(membership);
  }

  async listMembershipsForMember(tenantId: string, memberId: string) {
    await this.autoExpireStaleForTenant(tenantId);

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const memberships = await this.prisma.membership.findMany({
      where: { memberId },
      include: { plan: true },
    });

    return memberships.map((ms) => ({
      ...this.serializeMembership(ms),
      plan: ms.plan ? this.serializePlan(ms.plan) : null,
    }));
  }

  async renewMembership(
    tenantId: string,
    membershipId: string,
    input: { planId?: string; startDate?: string; finalPrice?: number },
  ) {
    const old = await this.prisma.membership.findFirst({
      where: { id: membershipId, member: { tenantId } },
      include: { member: true },
    });

    if (!old) {
      throw new NotFoundException('Membership not found.');
    }

    const planId = input.planId ?? old.planId;
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, tenantId },
    });

    if (!plan) {
      throw new BadRequestException(
        'Membership plan not found for this tenant.',
      );
    }

    // Default start: day after old end; fall back to provided date
    const startDate =
      input.startDate ?? addDays(toDateOnlyString(old.endDate), 1);

    let endDate: string;
    if (plan.planType === 'duration' && plan.durationDays) {
      endDate = addDays(startDate, plan.durationDays);
    } else {
      throw new BadRequestException(
        'Cannot auto-compute end date for this plan type; provide endDate.',
      );
    }

    const renewalId = `membership-${randomUUID()}`;

    const renewal = await this.prisma.$transaction(async (tx) => {
      if (old.status === 'active') {
        await tx.membership.update({
          where: { id: old.id },
          data: { status: 'expired' },
        });
      }

      return tx.membership.create({
        data: {
          id: renewalId,
          memberId: old.memberId,
          planId: plan.id,
          startDate: toDateOnly(startDate),
          endDate: toDateOnly(endDate),
          status: 'active',
          finalPrice: input.finalPrice ?? plan.price,
          previousMembershipId: old.id,
        },
      });
    });

    await this.notificationsService.createNotificationsForEvent(
      tenantId,
      'membershipActivated',
      renewal.memberId,
      {
        templateKey: 'membershipRenewed',
        variables: {
          planName: plan.name,
          endDate: toDateOnlyString(renewal.endDate),
        },
        relatedId: renewal.id,
      },
    );

    this.syncToDevice(old.member, renewal);
    await this.debtService.recompute(renewal.memberId);

    return this.serializeMembership(renewal);
  }

  async listFreezesForMembership(tenantId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, member: { tenantId } },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found.');
    }

    const freezes = await this.prisma.freeze.findMany({
      where: { membershipId },
    });
    return freezes.map((f) => this.serializeFreeze(f));
  }

  async createFreeze(
    tenantId: string,
    membershipId: string,
    input: { startDate?: string; endDate?: string },
  ) {
    if (!input.startDate || !input.endDate) {
      throw new BadRequestException(
        'Freeze start date and end date are required.',
      );
    }

    const start = new Date(input.startDate);
    const end = new Date(input.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid freeze dates.');
    }

    if (end <= start) {
      throw new BadRequestException(
        'Freeze end date must be after start date.',
      );
    }

    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, member: { tenantId } },
      include: { member: true },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found.');
    }

    if (membership.status !== 'active') {
      throw new BadRequestException('Only active memberships can be frozen.');
    }

    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: membership.planId },
    });

    if (!plan?.freezeAllowed) {
      throw new BadRequestException(
        'This membership plan does not allow freezes.',
      );
    }

    const freezeDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (plan.freezeMaxDays && freezeDays > plan.freezeMaxDays) {
      throw new BadRequestException(
        `Freeze duration exceeds the plan limit of ${plan.freezeMaxDays} days.`,
      );
    }

    const nextEndDate = toDateOnly(
      addDays(toDateOnlyString(membership.endDate), freezeDays),
    );

    const [frozenMembership, freeze] = await this.prisma.$transaction([
      this.prisma.membership.update({
        where: { id: membershipId },
        data: { status: 'frozen', endDate: nextEndDate },
      }),
      this.prisma.freeze.create({
        data: {
          id: `freeze-${randomUUID()}`,
          membershipId,
          startDate: toDateOnly(input.startDate),
          endDate: toDateOnly(input.endDate),
        },
      }),
    ]);

    // Push updated end date so the device extends the valid window
    this.syncToDevice(membership.member, frozenMembership);

    return {
      freeze: this.serializeFreeze(freeze),
      membership: this.serializeMembership(frozenMembership),
    };
  }

  async unfreezeM(tenantId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, member: { tenantId } },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found.');
    }

    if (membership.status !== 'frozen') {
      throw new BadRequestException('Only frozen memberships can be unfrozen.');
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { status: 'active' },
    });

    return this.serializeMembership(updated);
  }

  async createMembership(tenantId: string, input: CreateMembershipInput) {
    if (!input.memberId || !input.planId || !input.startDate) {
      throw new BadRequestException(
        'Member, plan, and start date are required.',
      );
    }

    await this.autoExpireStaleForTenant(tenantId);

    const member = await this.prisma.member.findFirst({
      where: { id: input.memberId, tenantId },
    });
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: input.planId, tenantId },
    });

    if (!member) {
      throw new BadRequestException('Member is invalid for this tenant.');
    }

    if (!plan) {
      throw new BadRequestException(
        'Membership plan is invalid for this tenant.',
      );
    }

    let endDate = input.endDate;

    if (!endDate) {
      if (plan.planType === 'duration' && plan.durationDays) {
        endDate = addDays(input.startDate, plan.durationDays);
      } else {
        throw new BadRequestException(
          'End date is required for this plan type.',
        );
      }
    }

    const newStart = toDateOnly(input.startDate);
    const newEnd = toDateOnly(endDate);

    // Block only a genuine date overlap, not just "any other membership
    // exists" — a member can be pre-sold a future membership that starts
    // after their current (or another already pre-sold) one ends.
    const overlapping = await this.prisma.membership.findFirst({
      where: {
        memberId: member.id,
        status: { in: ['active', 'frozen', 'draft'] },
        startDate: { lte: newEnd },
        endDate: { gte: newStart },
      },
      orderBy: { endDate: 'desc' },
    });

    if (overlapping) {
      throw new BadRequestException(
        `Member already has a membership covering this period (through ${toDateOnlyString(overlapping.endDate)}). Choose a start date after that, or expire/cancel it first.`,
      );
    }

    // A membership starting in the future isn't in effect yet — don't mark
    // it active (which would grant gate access / send the activation
    // notification) until its own start date arrives.
    const today = toDateOnly(localDateString());
    let status = input.status ?? 'active';
    if (status === 'active' && newStart > today) {
      status = 'draft';
    }

    const membership = await this.prisma.membership.create({
      data: {
        id: `membership-${randomUUID()}`,
        memberId: member.id,
        planId: plan.id,
        startDate: toDateOnly(input.startDate),
        endDate: toDateOnly(endDate),
        status,
        finalPrice: input.finalPrice ?? plan.price,
      },
    });

    if (status === 'active') {
      await this.activateMembership(tenantId, member, plan, membership);
    }

    await this.debtService.recompute(membership.memberId);

    return this.serializeMembership(membership);
  }

  /**
   * Best-effort push of a QR identifier to the BAS-IP device's local list so
   * the device can grant access offline. Every member always gets a QR
   * identifier regardless of whether they have an RFID tag.
   * Failures are logged but never propagated.
   */
  private syncToDevice(member: Member, membership: Membership): void {
    void this.basIpSyncService.pushQrIdentifier(
      member.id,
      member.fullName,
      toDateOnlyString(membership.startDate),
      toDateOnlyString(membership.endDate),
    );
  }

  // Postgres Decimal/Date columns come back from Prisma as Decimal/Date
  // objects; the API contract (and the web app, which calls
  // `.toLocaleString()` on prices and does raw string comparisons/display on
  // dates) expects plain numbers and "YYYY-MM-DD" strings, same as the old
  // JSON store.
  private serializePlan(plan: MembershipPlan) {
    return { ...plan, price: toNumber(plan.price) };
  }

  private serializeMembership(membership: Membership) {
    return {
      ...membership,
      startDate: toDateOnlyString(membership.startDate),
      endDate: toDateOnlyString(membership.endDate),
      finalPrice: toNumber(membership.finalPrice),
    };
  }

  private serializeFreeze(freeze: Freeze) {
    return {
      ...freeze,
      startDate: toDateOnlyString(freeze.startDate),
      endDate: toDateOnlyString(freeze.endDate),
    };
  }
}
