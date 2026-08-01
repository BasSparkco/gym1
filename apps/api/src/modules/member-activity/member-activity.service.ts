import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toNumber } from '../../common/decimal';

export type MemberActivityType =
  | 'NEW_MEMBERSHIP'
  | 'MEMBERSHIP_RENEWED'
  | 'COURSE_SIGNUP'
  | 'PAYMENT_SUCCESS';

export type MemberActivityEntry = {
  id: string;
  type: MemberActivityType;
  createdAt: string;
  membershipName?: string;
  courseName?: string;
  amountPaid?: number;
  debtRemaining?: number;
};

// There's no single activity/event log table, so the member-facing feed is
// assembled here by querying the tables that represent something happening
// to a member (a membership sold/renewed, a course signup, a payment
// received) and merging them by timestamp. Each source uses whichever
// timestamp field it actually has, since none of these models carry a
// generic createdAt.
//
// Deliberately NOT built on top of the owner-configurable Notification/
// NotificationEvent pipeline (see notifications.service.ts): that system
// only creates a row when the tenant has a channel enabled for that event,
// which is correct for "should we proactively message the member" but wrong
// for "what has actually happened on my account" — a member's own history
// must not depend on an unrelated notification-preferences toggle.
//
// Course signups read from ProgramEnrollmentEvent (an append-only log)
// rather than the live ProgramEnrollment row, because ProgramEnrollment is
// upserted on re-enrollment (composite-keyed on programId+memberId) and
// overwrites the prior signup with no trace of it.
@Injectable()
export class MemberActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async listForMember(
    tenantId: string,
    memberId: string,
  ): Promise<MemberActivityEntry[]> {
    const [member, memberships, enrollmentEvents, payments] = await Promise.all([
      this.prisma.member.findFirst({
        where: { id: memberId, tenantId },
        select: { debt: true },
      }),
      this.prisma.membership.findMany({
        where: { memberId },
        include: { plan: true },
      }),
      this.prisma.programEnrollmentEvent.findMany({
        where: { memberId },
        include: { program: true },
      }),
      this.prisma.payment.findMany({
        where: { memberId, tenantId, status: 'paid' },
      }),
    ]);

    // The member's current outstanding balance, same cached field the rest
    // of the app reads (see DebtService) — there's no per-payment ledger to
    // reconstruct a historical "debt as of that payment" figure from.
    const debtRemaining = toNumber(member?.debt ?? null) ?? 0;

    const membershipEntries: MemberActivityEntry[] = memberships.map((m) => ({
      id: m.id,
      type: m.previousMembershipId ? 'MEMBERSHIP_RENEWED' : 'NEW_MEMBERSHIP',
      createdAt: m.startDate.toISOString(),
      membershipName: m.plan?.name,
    }));

    const enrollmentEntries: MemberActivityEntry[] = enrollmentEvents.map(
      (e) => ({
        id: e.id,
        type: 'COURSE_SIGNUP',
        createdAt: e.enrolledAt.toISOString(),
        courseName: e.program?.name,
      }),
    );

    const paymentEntries: MemberActivityEntry[] = payments.map((p) => ({
      id: p.id,
      type: 'PAYMENT_SUCCESS',
      createdAt: p.paymentDate.toISOString(),
      amountPaid: toNumber(p.amount),
      debtRemaining,
    }));

    return [...membershipEntries, ...enrollmentEntries, ...paymentEntries].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    );
  }
}
