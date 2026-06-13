import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  FreezeRecord,
  MembershipPlanRecord,
  MembershipRecord,
  readOperationsStore,
  writeOperationsStore,
} from '../../data/operations-store';
import { NotificationsService } from '../notifications/notifications.service';

type CreateMembershipPlanInput = {
  name?: string;
  planType?: 'duration' | 'session';
  durationDays?: number;
  sessionCount?: number;
  price?: number;
  allowAllBranches?: boolean;
  freezeAllowed?: boolean;
  freezeMaxDays?: number;
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
};

type CreateMembershipInput = {
  memberId?: string;
  planId?: string;
  startDate?: string;
  endDate?: string;
  status?: MembershipRecord['status'];
  finalPrice?: number;
};

type UpdateMembershipInput = {
  status?: MembershipRecord['status'];
  startDate?: string;
  endDate?: string;
  finalPrice?: number;
};

const validMembershipStatuses = new Set<MembershipRecord['status']>([
  'draft',
  'active',
  'frozen',
  'expired',
  'cancelled',
]);

@Injectable()
export class MembershipsService {
  constructor(private readonly notificationsService: NotificationsService) {}

  listMembershipsForTenant(tenantId: string) {
    const store = readOperationsStore();
    const tenantMemberIds = new Set(
      store.members
        .filter((member) => member.tenantId === tenantId)
        .map((member) => member.id),
    );
    const tenantPlanIds = new Set(
      store.membershipPlans
        .filter((plan) => plan.tenantId === tenantId)
        .map((plan) => plan.id),
    );

    return store.memberships.filter((membership) => {
      return (
        tenantMemberIds.has(membership.memberId) &&
        tenantPlanIds.has(membership.planId)
      );
    });
  }

  listMembershipPlansForTenant(tenantId: string) {
    return readOperationsStore().membershipPlans.filter((plan) => {
      return plan.tenantId === tenantId;
    });
  }

  getMembershipPlanForTenant(tenantId: string, planId: string) {
    const plan = readOperationsStore().membershipPlans.find(
      (candidate) => candidate.id === planId && candidate.tenantId === tenantId,
    );

    if (!plan) {
      throw new NotFoundException('Membership plan not found.');
    }

    return plan;
  }

  createMembershipPlan(tenantId: string, input: CreateMembershipPlanInput) {
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

    const store = readOperationsStore();
    const plan: MembershipPlanRecord = {
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
    };

    store.membershipPlans.push(plan);
    writeOperationsStore(store);

    return plan;
  }

  updateMembershipPlan(
    tenantId: string,
    planId: string,
    input: UpdateMembershipPlanInput,
  ) {
    const store = readOperationsStore();
    const idx = store.membershipPlans.findIndex(
      (candidate) => candidate.id === planId && candidate.tenantId === tenantId,
    );

    if (idx === -1) {
      throw new NotFoundException('Membership plan not found.');
    }

    const current = store.membershipPlans[idx];
    const planType = input.planType ?? current.planType;
    const name = input.name === undefined ? current.name : input.name.trim();

    if (!name) {
      throw new BadRequestException('Plan name is required.');
    }

    const next: MembershipPlanRecord = {
      ...current,
      name,
      planType,
      durationDays:
        planType === 'duration'
          ? (input.durationDays ??
            (current.planType === 'duration'
              ? current.durationDays
              : undefined))
          : undefined,
      sessionCount:
        planType === 'session'
          ? (input.sessionCount ??
            (current.planType === 'session' ? current.sessionCount : undefined))
          : undefined,
      price: input.price ?? current.price,
      allowAllBranches: input.allowAllBranches ?? current.allowAllBranches,
      freezeAllowed: input.freezeAllowed ?? current.freezeAllowed,
      freezeMaxDays:
        (input.freezeAllowed ?? current.freezeAllowed)
          ? (input.freezeMaxDays ?? current.freezeMaxDays)
          : undefined,
    };

    store.membershipPlans[idx] = next;
    writeOperationsStore(store);

    return next;
  }

  getMembershipForTenant(tenantId: string, membershipId: string) {
    const store = readOperationsStore();
    const tenantMemberIds = new Set(
      store.members
        .filter((member) => member.tenantId === tenantId)
        .map((member) => member.id),
    );
    const membership = store.memberships.find(
      (candidate) =>
        candidate.id === membershipId &&
        tenantMemberIds.has(candidate.memberId),
    );

    if (!membership) {
      throw new NotFoundException('Membership not found.');
    }

    return membership;
  }

  updateMembership(
    tenantId: string,
    membershipId: string,
    input: UpdateMembershipInput,
  ) {
    const store = readOperationsStore();
    const tenantMemberIds = new Set(
      store.members
        .filter((member) => member.tenantId === tenantId)
        .map((member) => member.id),
    );
    const idx = store.memberships.findIndex(
      (candidate) =>
        candidate.id === membershipId &&
        tenantMemberIds.has(candidate.memberId),
    );

    if (idx === -1) {
      throw new NotFoundException('Membership not found.');
    }

    if (
      input.status !== undefined &&
      !validMembershipStatuses.has(input.status)
    ) {
      throw new BadRequestException('Membership status is invalid.');
    }

    const current = store.memberships[idx];
    const next: MembershipRecord = {
      ...current,
      status: input.status ?? current.status,
      startDate: input.startDate ?? current.startDate,
      endDate: input.endDate ?? current.endDate,
      finalPrice: input.finalPrice ?? current.finalPrice,
    };

    store.memberships[idx] = next;
    writeOperationsStore(store);

    return next;
  }

  listMembershipsForMember(tenantId: string, memberId: string) {
    const store = readOperationsStore();
    const member = store.members.find(
      (candidate) =>
        candidate.id === memberId && candidate.tenantId === tenantId,
    );

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const planMap = new Map(
      store.membershipPlans.map((plan) => [plan.id, plan]),
    );

    return store.memberships
      .filter((ms) => ms.memberId === memberId)
      .map((ms) => ({ ...ms, plan: planMap.get(ms.planId) ?? null }));
  }

  async renewMembership(
    tenantId: string,
    membershipId: string,
    input: { planId?: string; startDate?: string; finalPrice?: number },
  ) {
    const store = readOperationsStore();
    const tenantMemberIds = new Set(
      store.members.filter((m) => m.tenantId === tenantId).map((m) => m.id),
    );
    const idx = store.memberships.findIndex(
      (ms) => ms.id === membershipId && tenantMemberIds.has(ms.memberId),
    );

    if (idx === -1) {
      throw new NotFoundException('Membership not found.');
    }

    const old = store.memberships[idx];
    const planId = input.planId ?? old.planId;
    const plan = store.membershipPlans.find(
      (p) => p.id === planId && p.tenantId === tenantId,
    );

    if (!plan) {
      throw new BadRequestException(
        'Membership plan not found for this tenant.',
      );
    }

    // Default start: day after old end; fall back to provided date
    let startDate = input.startDate;
    if (!startDate) {
      const oldEnd = new Date(old.endDate);
      oldEnd.setDate(oldEnd.getDate() + 1);
      startDate = oldEnd.toISOString().slice(0, 10);
    }

    let endDate: string;
    if (plan.planType === 'duration' && plan.durationDays) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + plan.durationDays);
      endDate = start.toISOString().slice(0, 10);
    } else {
      throw new BadRequestException(
        'Cannot auto-compute end date for this plan type; provide endDate.',
      );
    }

    // Mark old membership expired if still active
    if (old.status === 'active') {
      store.memberships[idx] = { ...old, status: 'expired' };
    }

    const renewal: MembershipRecord = {
      id: `membership-${randomUUID()}`,
      memberId: old.memberId,
      planId,
      startDate,
      endDate,
      status: 'active',
      finalPrice: input.finalPrice ?? plan.price,
      previousMembershipId: old.id,
    };

    store.memberships.push(renewal);
    writeOperationsStore(store);

    await this.notificationsService.createNotificationsForEvent(
      tenantId,
      'membershipActivated',
      renewal.memberId,
      {
        subject: 'Membership renewed',
        body: `Your ${plan.name} membership has been renewed and now runs through ${renewal.endDate}.`,
        relatedId: renewal.id,
      },
    );

    return renewal;
  }

  listFreezesForMembership(tenantId: string, membershipId: string) {
    const store = readOperationsStore();
    const tenantMemberIds = new Set(
      store.members.filter((m) => m.tenantId === tenantId).map((m) => m.id),
    );
    const membership = store.memberships.find(
      (ms) => ms.id === membershipId && tenantMemberIds.has(ms.memberId),
    );

    if (!membership) {
      throw new NotFoundException('Membership not found.');
    }

    return store.freezes.filter((f) => f.membershipId === membershipId);
  }

  createFreeze(
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

    const store = readOperationsStore();
    const tenantMemberIds = new Set(
      store.members.filter((m) => m.tenantId === tenantId).map((m) => m.id),
    );
    const msIdx = store.memberships.findIndex(
      (ms) => ms.id === membershipId && tenantMemberIds.has(ms.memberId),
    );

    if (msIdx === -1) {
      throw new NotFoundException('Membership not found.');
    }

    const membership = store.memberships[msIdx];

    if (membership.status !== 'active') {
      throw new BadRequestException('Only active memberships can be frozen.');
    }

    const plan = store.membershipPlans.find((p) => p.id === membership.planId);

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

    // Extend membership end date by the freeze duration
    const currentEnd = new Date(membership.endDate);
    currentEnd.setDate(currentEnd.getDate() + freezeDays);

    store.memberships[msIdx] = {
      ...membership,
      status: 'frozen',
      endDate: currentEnd.toISOString().slice(0, 10),
    };

    const freeze: FreezeRecord = {
      id: `freeze-${randomUUID()}`,
      membershipId,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: new Date().toISOString(),
    };

    store.freezes.push(freeze);
    writeOperationsStore(store);

    return { freeze, membership: store.memberships[msIdx] };
  }

  unfreezeM(tenantId: string, membershipId: string) {
    const store = readOperationsStore();
    const tenantMemberIds = new Set(
      store.members.filter((m) => m.tenantId === tenantId).map((m) => m.id),
    );
    const idx = store.memberships.findIndex(
      (ms) => ms.id === membershipId && tenantMemberIds.has(ms.memberId),
    );

    if (idx === -1) {
      throw new NotFoundException('Membership not found.');
    }

    const membership = store.memberships[idx];

    if (membership.status !== 'frozen') {
      throw new BadRequestException('Only frozen memberships can be unfrozen.');
    }

    store.memberships[idx] = { ...membership, status: 'active' };
    writeOperationsStore(store);

    return store.memberships[idx];
  }

  async createMembership(tenantId: string, input: CreateMembershipInput) {
    if (!input.memberId || !input.planId || !input.startDate) {
      throw new BadRequestException(
        'Member, plan, and start date are required.',
      );
    }

    const store = readOperationsStore();
    const member = store.members.find((candidate) => {
      return candidate.id === input.memberId && candidate.tenantId === tenantId;
    });
    const plan = store.membershipPlans.find((candidate) => {
      return candidate.id === input.planId && candidate.tenantId === tenantId;
    });

    if (!member) {
      throw new BadRequestException('Member is invalid for this tenant.');
    }

    if (!plan) {
      throw new BadRequestException(
        'Membership plan is invalid for this tenant.',
      );
    }

    const existingActive = store.memberships.find(
      (ms) => ms.memberId === member.id && ms.status === 'active',
    );

    if (existingActive) {
      throw new BadRequestException('Member already has an active membership.');
    }

    let endDate = input.endDate;

    if (!endDate) {
      if (plan.planType === 'duration' && plan.durationDays) {
        const start = new Date(input.startDate);
        start.setDate(start.getDate() + plan.durationDays);
        endDate = start.toISOString().slice(0, 10);
      } else {
        throw new BadRequestException(
          'End date is required for this plan type.',
        );
      }
    }

    const membership: MembershipRecord = {
      id: `membership-${randomUUID()}`,
      memberId: member.id,
      planId: plan.id,
      startDate: input.startDate,
      endDate,
      status: input.status ?? 'active',
      finalPrice: input.finalPrice ?? plan.price,
    };

    store.memberships.push(membership);
    writeOperationsStore(store);

    if (membership.status === 'active') {
      await this.notificationsService.createNotificationsForEvent(
        tenantId,
        'membershipActivated',
        membership.memberId,
        {
          subject: 'Welcome to Spark Gym',
          body: `Your ${plan.name} membership is now active and runs through ${membership.endDate}.`,
          relatedId: membership.id,
        },
      );
    }

    return membership;
  }
}
