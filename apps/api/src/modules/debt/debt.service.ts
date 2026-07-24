import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, PrismaClient } from '../../generated/prisma/client';
import { toNumber } from '../../common/decimal';

/**
 * Pure computation, exported separately from the service so the one-time
 * backfill script (`scripts/backfill-member-debt.ts`, which builds its own
 * standalone PrismaClient outside Nest's DI container) can reuse the exact
 * same logic instead of re-implementing it.
 *
 * Debt = everything ever charged to the member (memberships, locker
 * rentals, course enrollments — excluding cancelled ones, which represent a
 * voided charge; a draft membership hasn't started yet either) minus
 * everything actually paid (`Payment.status === 'paid'`, regardless of
 * which membership the payment happened to be recorded against — staff
 * record a payment as money received from the member, not earmarked to one
 * specific charge).
 */
export async function computeMemberDebt(
  prisma: PrismaClient,
  memberId: string,
): Promise<Prisma.Decimal> {
  const [memberships, lockerRentals, enrollments, payments] = await Promise.all([
    prisma.membership.findMany({
      where: { memberId, status: { notIn: ['draft', 'cancelled'] } },
      select: { finalPrice: true },
    }),
    prisma.lockerRental.findMany({
      where: { memberId, status: { not: 'cancelled' } },
      select: { finalPrice: true },
    }),
    prisma.programEnrollment.findMany({
      where: { memberId, status: { not: 'cancelled' } },
      select: { finalPrice: true },
    }),
    prisma.payment.findMany({
      where: { memberId, status: 'paid' },
      select: { amount: true },
    }),
  ]);

  const owed = [...memberships, ...lockerRentals, ...enrollments].reduce(
    (sum, row) => sum.add(row.finalPrice),
    new Prisma.Decimal(0),
  );
  const paid = payments.reduce(
    (sum, row) => sum.add(row.amount),
    new Prisma.Decimal(0),
  );

  return owed.sub(paid);
}

@Injectable()
export class DebtService {
  constructor(private readonly prisma: PrismaService) {}

  /** Recomputes and persists a member's debt, returning the fresh value. */
  async recompute(memberId: string): Promise<number> {
    const debt = await computeMemberDebt(this.prisma, memberId);
    await this.prisma.member.update({
      where: { id: memberId },
      data: { debt },
    });
    return toNumber(debt);
  }

  /** Recomputes without requiring the caller to already know the member
   * exists in a given tenant — throws if it doesn't. */
  async recomputeForTenant(tenantId: string, memberId: string): Promise<number> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
      select: { id: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found.');
    }
    return this.recompute(memberId);
  }
}
