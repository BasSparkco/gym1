/**
 * One-time backfill for tenants that existed before the discount feature
 * shipped (discount.md §4) — creates the seven default DiscountType rows for
 * any tenant that doesn't already have discount types. Safe to re-run: a
 * tenant that already has at least one DiscountType is skipped entirely, so
 * it never duplicates or overwrites owner-edited types.
 *
 * Run with (same build-first convention as backfill-member-debt.ts):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/backfill-discount-types.js
 */

import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { DEFAULT_DISCOUNT_TYPE_NAMES } from '../modules/discount-types/default-discount-types';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });

    let seeded = 0;
    for (const tenant of tenants) {
      const existingCount = await prisma.discountType.count({ where: { tenantId: tenant.id } });
      if (existingCount > 0) continue;

      await prisma.discountType.createMany({
        data: DEFAULT_DISCOUNT_TYPE_NAMES.map((name) => ({
          id: `discount-type-${randomUUID()}`,
          tenantId: tenant.id,
          name,
        })),
      });
      seeded++;
      console.log(`Seeded default discount types for "${tenant.name}" (${tenant.id}).`);
    }

    console.log(`Done. Seeded ${seeded} of ${tenants.length} tenant(s); the rest already had discount types.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
