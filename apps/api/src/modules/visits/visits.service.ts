import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { localDateString, toDateOnlyString } from '../../common/date';
import { toNumber } from '../../common/decimal';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessMethod, Membership, MembershipPlan } from '../../generated/prisma/client';

type CreateVisitInput = {
  memberId?: string;
  branchId?: string;
  checkInTime?: string;
  accessMethod?: AccessMethod;
};

type CheckInInput = {
  memberIdentifier?: string;
  accessMethod?: AccessMethod;
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
      membership: unknown;
      visit: unknown;
    };

// A UTC-day range for "today" — matches the original's
// `checkInTime.startsWith(localDateString())` string-prefix check exactly
// (a pre-existing quirk mixing local "today" with a UTC timestamp string;
// ported as-is rather than fixed here, per the migration plan).
function todayUtcRange(): { gte: Date; lt: Date } {
  const gte = new Date(`${localDateString()}T00:00:00.000Z`);
  const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
  return { gte, lt };
}

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getVisitForScope(
    tenantId: string,
    branchId: string | undefined,
    visitId: string,
  ) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        id: visitId,
        member: { tenantId },
        ...(branchId ? { branchId } : {}),
      },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    return visit;
  }

  async listVisitsForScope(tenantId: string, branchId: string | undefined) {
    return this.prisma.visit.findMany({
      where: { member: { tenantId }, ...(branchId ? { branchId } : {}) },
    });
  }

  async checkIn(
    tenantId: string,
    branchId: string,
    input: CheckInInput,
  ): Promise<CheckInResult> {
    const identifier = input.memberIdentifier?.trim();

    if (!identifier) {
      return { granted: false, reason: 'Member identifier is required.' };
    }

    const today = toDateOnly(localDateString());

    const member = await this.prisma.member.findFirst({
      where: {
        tenantId,
        OR: [{ memberNumber: identifier }, { id: identifier }],
      },
    });

    if (!member) {
      return { granted: false, reason: 'Member not found.' };
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        memberId: member.id,
        status: 'active',
        startDate: { lte: today },
        endDate: { gte: today },
      },
      include: { plan: true },
    });

    if (!membership) {
      return {
        granted: false,
        reason: 'No valid active membership for today.',
      };
    }

    const alreadyCheckedIn = await this.prisma.visit.findFirst({
      where: {
        memberId: member.id,
        branchId,
        checkOutTime: null,
        checkInTime: todayUtcRange(),
      },
    });

    if (alreadyCheckedIn) {
      return { granted: false, reason: 'Member is already checked in.' };
    }

    const visit = await this.prisma.visit.create({
      data: {
        id: `visit-${randomUUID()}`,
        memberId: member.id,
        branchId,
        checkInTime: new Date(),
        checkOutTime: null,
        accessMethod: input.accessMethod ?? 'manual',
      },
    });

    await this.matchClassBookingAttendance(member.id, branchId, visit.id, visit.checkInTime);

    return {
      granted: true,
      member: {
        id: member.id,
        fullName: member.fullName,
        memberNumber: member.memberNumber,
        status: 'active' as const,
      },
      membership: {
        ...membership,
        startDate: toDateOnlyString(membership.startDate),
        endDate: toDateOnlyString(membership.endDate),
        finalPrice: toNumber(membership.finalPrice),
        plan: membership.plan ? this.serializePlan(membership.plan) : null,
      },
      visit,
    };
  }

  async checkOut(tenantId: string, branchId: string, visitId: string) {
    const visit = await this.prisma.visit.findFirst({
      where: { id: visitId, branchId, member: { tenantId } },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    if (visit.checkOutTime !== null) {
      throw new BadRequestException('Visit already checked out.');
    }

    return this.prisma.visit.update({
      where: { id: visitId },
      data: { checkOutTime: new Date() },
    });
  }

  async createVisit(tenantId: string, branchId: string, input: CreateVisitInput) {
    if (!input.memberId || !input.checkInTime) {
      throw new BadRequestException('Member and check-in time are required.');
    }

    const targetBranchId = input.branchId ?? branchId;

    const branch = await this.prisma.branch.findFirst({
      where: { id: targetBranchId, tenantId },
    });
    const member = await this.prisma.member.findFirst({
      where: { id: input.memberId, tenantId },
    });

    if (!branch) {
      throw new BadRequestException('Branch is invalid for this tenant.');
    }

    if (!member) {
      throw new BadRequestException('Member is invalid for this tenant.');
    }

    return this.prisma.visit.create({
      data: {
        id: `visit-${randomUUID()}`,
        memberId: input.memberId,
        branchId: targetBranchId,
        checkInTime: new Date(input.checkInTime),
        checkOutTime: null,
        accessMethod: input.accessMethod ?? 'manual',
      },
    });
  }

  private serializePlan(plan: MembershipPlan) {
    return { ...plan, price: toNumber(plan.price) };
  }

  /**
   * Best-effort: if this check-in falls within a class the member has
   * booked at this branch today, mark that booking `attended` and link the
   * visit. Reuses the gate check-in flow rather than a second attendance
   * pipeline (RFID/QR/manual all funnel through here already).
   */
  private async matchClassBookingAttendance(
    memberId: string,
    branchId: string,
    visitId: string,
    checkInTime: Date,
  ): Promise<void> {
    try {
      const today = toDateOnly(localDateString());
      const booking = await this.prisma.classBooking.findFirst({
        where: {
          memberId,
          status: 'booked',
          visitId: null,
          classSession: {
            branchId,
            date: today,
            startTime: { lte: checkInTime },
            endTime: { gte: checkInTime },
          },
        },
      });

      if (booking) {
        await this.prisma.classBooking.update({
          where: { id: booking.id },
          data: { status: 'attended', visitId },
        });
      }
    } catch {
      // Never block check-in on attendance matching.
    }
  }
}

function toDateOnly(dateStr: string): Date {
  return new Date(dateStr);
}
