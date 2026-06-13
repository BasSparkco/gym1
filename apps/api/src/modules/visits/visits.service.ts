import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  MembershipPlanRecord,
  MembershipRecord,
  VisitRecord,
  readOperationsStore,
  writeOperationsStore,
} from '../../data/operations-store';

type CreateVisitInput = {
  memberId?: string;
  branchId?: string;
  checkInTime?: string;
  accessMethod?: VisitRecord['accessMethod'];
};

type CheckInInput = {
  memberIdentifier?: string;
  accessMethod?: VisitRecord['accessMethod'];
};

type CheckInResult =
  | { granted: false; reason: string }
  | {
      granted: true;
      member: {
        id: string;
        fullName: string;
        memberNumber: string;
        status: string;
      };
      membership: MembershipRecord & { plan: MembershipPlanRecord | null };
      visit: VisitRecord;
    };

@Injectable()
export class VisitsService {
  getVisitForScope(tenantId: string, branchId: string, visitId: string) {
    const store = readOperationsStore();
    const memberIds = new Set(
      store.members
        .filter((member) => member.tenantId === tenantId)
        .map((member) => member.id),
    );
    const visit = store.visits.find(
      (candidate) =>
        candidate.id === visitId &&
        candidate.branchId === branchId &&
        memberIds.has(candidate.memberId),
    );

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    return visit;
  }

  listVisitsForScope(tenantId: string, branchId: string) {
    const store = readOperationsStore();
    const memberIds = new Set(
      store.members
        .filter((member) => member.tenantId === tenantId)
        .map((member) => member.id),
    );

    return store.visits.filter((visit) => {
      return visit.branchId === branchId && memberIds.has(visit.memberId);
    });
  }

  checkIn(
    tenantId: string,
    branchId: string,
    input: CheckInInput,
  ): CheckInResult {
    const identifier = input.memberIdentifier?.trim();

    if (!identifier) {
      return { granted: false, reason: 'Member identifier is required.' };
    }

    const store = readOperationsStore();
    const today = new Date().toISOString().slice(0, 10);

    const member = store.members.find(
      (m) =>
        m.tenantId === tenantId &&
        (m.memberNumber === identifier || m.id === identifier),
    );

    if (!member) {
      return { granted: false, reason: 'Member not found.' };
    }

    if (member.status !== 'active') {
      return { granted: false, reason: 'Member account is inactive.' };
    }

    const membership = store.memberships.find(
      (ms) =>
        ms.memberId === member.id &&
        ms.status === 'active' &&
        ms.startDate <= today &&
        ms.endDate >= today,
    );

    if (!membership) {
      return {
        granted: false,
        reason: 'No valid active membership for today.',
      };
    }

    const plan =
      store.membershipPlans.find((p) => p.id === membership.planId) ?? null;

    const alreadyCheckedIn = store.visits.some(
      (v) =>
        v.memberId === member.id &&
        v.branchId === branchId &&
        v.checkInTime.startsWith(today) &&
        v.checkOutTime === null,
    );

    if (alreadyCheckedIn) {
      return { granted: false, reason: 'Member is already checked in.' };
    }

    const visit: VisitRecord = {
      id: `visit-${randomUUID()}`,
      memberId: member.id,
      branchId,
      checkInTime: new Date().toISOString(),
      checkOutTime: null,
      accessMethod: input.accessMethod ?? 'manual',
    };

    store.visits.push(visit);
    writeOperationsStore(store);

    return {
      granted: true,
      member: {
        id: member.id,
        fullName: member.fullName,
        memberNumber: member.memberNumber,
        status: member.status,
      },
      membership: { ...membership, plan },
      visit,
    };
  }

  checkOut(tenantId: string, branchId: string, visitId: string) {
    const store = readOperationsStore();
    const memberIds = new Set(
      store.members
        .filter((member) => member.tenantId === tenantId)
        .map((member) => member.id),
    );
    const visit = store.visits.find(
      (v) =>
        v.id === visitId &&
        v.branchId === branchId &&
        memberIds.has(v.memberId),
    );

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    if (visit.checkOutTime !== null) {
      throw new BadRequestException('Visit already checked out.');
    }

    visit.checkOutTime = new Date().toISOString();
    writeOperationsStore(store);

    return visit;
  }

  createVisit(tenantId: string, branchId: string, input: CreateVisitInput) {
    if (!input.memberId || !input.checkInTime) {
      throw new BadRequestException('Member and check-in time are required.');
    }

    const store = readOperationsStore();
    const targetBranchId = input.branchId ?? branchId;
    const branch = store.branches.find((candidate) => {
      return candidate.id === targetBranchId && candidate.tenantId === tenantId;
    });
    const member = store.members.find((candidate) => {
      return candidate.id === input.memberId && candidate.tenantId === tenantId;
    });

    if (!branch) {
      throw new BadRequestException('Branch is invalid for this tenant.');
    }

    if (!member) {
      throw new BadRequestException('Member is invalid for this tenant.');
    }

    const visit: VisitRecord = {
      id: `visit-${randomUUID()}`,
      memberId: input.memberId,
      branchId: targetBranchId,
      checkInTime: input.checkInTime,
      checkOutTime: null,
      accessMethod: input.accessMethod ?? 'manual',
    };

    store.visits.push(visit);
    writeOperationsStore(store);

    return visit;
  }
}
