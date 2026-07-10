/**
 * One-time backfill for the User->Employee link (migration
 * 20260710000000_link_user_to_employee added User.employeeId as a nullable
 * FK, but existing rows were created before the column existed and have no
 * connection to a real employee record).
 *
 * For every User with employeeId still null, picks a random employee in the
 * same tenant that isn't already linked to another account and links them
 * (also flips Employee.isUser to true, mirroring what AuthService.createUser
 * does for new accounts going forward). Skips a user if its tenant has no
 * unlinked employee left — that user is reported and must be linked by hand.
 *
 * Run with: pnpm --filter api exec ts-node -r tsconfig-paths/register src/scripts/backfill-user-employee-links.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const unlinkedUsers = await prisma.user.findMany({
      where: { employeeId: null },
    });

    if (unlinkedUsers.length === 0) {
      console.log('No users need backfilling.');
      return;
    }

    let linked = 0;
    for (const user of unlinkedUsers) {
      const candidates = shuffle(
        await prisma.employee.findMany({
          where: { tenantId: user.tenantId, status: 'active', user: null },
        }),
      );
      const employee = candidates[0];
      if (!employee) {
        console.warn(
          `No unlinked employee available for user ${user.id} (${user.email}, tenant ${user.tenantId}) — link manually.`,
        );
        continue;
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { employeeId: employee.id },
        }),
        prisma.employee.update({
          where: { id: employee.id },
          data: { isUser: true },
        }),
      ]);
      console.log(`Linked user ${user.id} (${user.email}) -> employee ${employee.id} (${employee.fullName})`);
      linked++;
    }

    console.log(`Done. Linked ${linked}/${unlinkedUsers.length} user(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
