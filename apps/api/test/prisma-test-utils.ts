/**
 * Resets the e2e test Postgres database to the default seed data —
 * defaultOperationsSeed / defaultAuthSeed / default tenant settings — so
 * every test starts from fresh, known state.
 */

import type Redis from 'ioredis';
import { defaultOperationsSeed } from '../src/data/operations-seed';
import { defaultAuthSeed } from '../src/modules/auth/auth.service';
import { getDefaultTenantSettings } from '../src/data/settings-seed';
import { PrismaClient } from '../src/generated/prisma/client';
import { importJsonDataIntoPrisma } from '../src/prisma/seed-import';

export async function resetPrismaTestData(prisma: PrismaClient, redis: Redis) {
  // A single TRUNCATE ... CASCADE is atomic and FK-order-agnostic, unlike a
  // sequence of per-model deleteMany() calls, which raced against writes from
  // still-open NestJS app instances from earlier tests in this suite (each
  // beforeEach boots a fresh app without closing the previous one).
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "User", "TenantSettings", "Notification", ' +
      '"Payment", "Freeze", "Visit", "Membership", "MembershipPlan", ' +
      '"EmployeeGate", "Member", "Gate", "Employee", "Branch", "Tenant" ' +
      'RESTART IDENTITY CASCADE;',
  );

  // Sessions now live in Redis, not Postgres — flush the (test-isolated,
  // db-index-scoped) instance the same way the TRUNCATE resets Postgres.
  await redis.flushdb();

  await importJsonDataIntoPrisma(
    prisma,
    defaultOperationsSeed,
    { tenants: [getDefaultTenantSettings('tenant-spark-gym')] },
    { users: defaultAuthSeed.users },
  );
}
