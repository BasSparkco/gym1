/**
 * Resets the e2e test Postgres database to the same default seed data the
 * JSON-store test isolation (see app.e2e-spec.ts's beforeEach) resets to —
 * defaultOperationsSeed / defaultAuthSeed / default tenant settings — so
 * modules already converted to Prisma see fresh, known state on every test,
 * same as modules still reading the JSON store do.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type Redis from 'ioredis';
import { defaultOperationsSeed } from '../src/data/operations-store';
import { defaultAuthSeed } from '../src/modules/auth/auth.service';
import { getDefaultTenantSettings } from '../src/data/settings-store';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  importJsonDataIntoPrisma,
  SettingsStoreData,
} from '../src/prisma/seed-import';

// Mirrors ensureSettingsStoreFile()'s bootstrap logic: bootstraps from the
// real data/settings-seed.json committed in the repo when present, falling
// back to the code-level defaults otherwise — the JSON-store side of the
// test fixture (still used by not-yet-converted modules) does the same, and
// this fell out of sync once (the code defaults omit whatsapp for
// membershipActivated, which the committed seed enables — causing a
// membership-sold notification test to only get an email-channel attempt
// with no email on file).
function loadSettingsSeed(): SettingsStoreData {
  const seedPath = join(__dirname, '..', 'data', 'settings-seed.json');
  if (existsSync(seedPath)) {
    return JSON.parse(readFileSync(seedPath, 'utf8')) as SettingsStoreData;
  }
  return { tenants: [getDefaultTenantSettings('tenant-spark-gym')] };
}

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
    loadSettingsSeed(),
    { users: defaultAuthSeed.users },
  );
}
