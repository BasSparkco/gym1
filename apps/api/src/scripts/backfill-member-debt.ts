/**
 * One-time backfill for Member.debt (migration 20260724222447_add_member_debt
 * added the column with a DEFAULT 0, which is wrong for every member who
 * already has memberships/locker rentals/course enrollments/payments on
 * record — this recomputes the real figure for all of them).
 *
 * Reuses the exact same computation DebtService uses at runtime
 * (`computeMemberDebt`), so this can never drift from the live logic.
 *
 * Run with (this repo's `nest build`/ts-node interplay has a known
 * generated-Prisma-client extension-resolution issue under bare ts-node —
 * build first, then run the compiled output, same as the seed script):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/backfill-member-debt.js
 * (from the repo root; or from apps/api: node --env-file=.env dist/scripts/backfill-member-debt.js)
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { computeMemberDebt } from '../modules/debt/debt.service';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const members = await prisma.member.findMany({ select: { id: true } });

    let changed = 0;
    for (const member of members) {
      const debt = await computeMemberDebt(prisma, member.id);
      await prisma.member.update({ where: { id: member.id }, data: { debt } });
      if (!debt.isZero()) changed++;
    }

    console.log(`Done. Recomputed debt for ${members.length} member(s), ${changed} with a non-zero balance.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
