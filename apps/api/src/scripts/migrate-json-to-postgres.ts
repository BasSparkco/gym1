/**
 * One-time migration: import the flat JSON stores (operations-store.json,
 * settings-store.json, auth-store.json) into Postgres via Prisma.
 *
 * Reads from <API_DATA_ROOT>/.local, the same location the running app
 * reads/writes today (see src/data/operations-store.ts, settings-store.ts,
 * and src/modules/auth/auth.service.ts's getAuthPaths()). Point API_DATA_ROOT
 * at wherever the live data actually lives when cutting over production —
 * e.g. run this as a one-off container with the `api-data` volume mounted,
 * since that volume (not this repo's local .local/ folder) holds the real
 * accumulated data. See POSTGRES_MIGRATION.md for the full recipe.
 *
 * Does NOT touch or delete the source JSON files, and is never invoked
 * automatically (not wired into postinstall/CMD/any startup hook) — run it
 * manually once during cutover, after building the project (this script
 * imports the generated Prisma client's compiled output, same as the app
 * itself, to avoid runtime module-resolution issues with ts-node):
 *
 *   pnpm build
 *   DATABASE_URL=postgresql://... API_DATA_ROOT=/path/to/data \
 *     node dist/scripts/migrate-json-to-postgres.js [--force]
 *
 * --force allows re-running against a database that already has Tenant rows
 * (by default the script aborts, to avoid double-importing).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import {
  AuthStoreData,
  OperationsStoreData,
  SettingsStoreData,
  importJsonDataIntoPrisma,
} from '../prisma/seed-import';

function getDataRoot() {
  // Compiled to dist/scripts/migrate-json-to-postgres.js, so two levels up
  // reaches the apps/api root — same as operations-store.ts's getStorePaths().
  return process.env.API_DATA_ROOT ?? join(__dirname, '..', '..');
}

function readJson<T>(relativePath: string): T {
  const fullPath = join(getDataRoot(), relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Expected file not found: ${fullPath}`);
  }
  return JSON.parse(readFileSync(fullPath, 'utf8')) as T;
}

async function main() {
  const force = process.argv.includes('--force');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set.');
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const existingTenantCount = await prisma.tenant.count();
  if (existingTenantCount > 0 && !force) {
    throw new Error(
      `Tenant table already has ${existingTenantCount} row(s) — refusing to re-import without --force.`,
    );
  }

  console.log(`Reading JSON stores from: ${getDataRoot()}`);
  const operations = readJson<OperationsStoreData>(
    '.local/operations-store.json',
  );
  const settings = readJson<SettingsStoreData>('.local/settings-store.json');
  const auth = readJson<AuthStoreData>('.local/auth-store.json');

  await importJsonDataIntoPrisma(prisma, operations, settings, auth);

  // ── verify row-count parity ──
  const checks: Array<[string, number, () => Promise<number>]> = [
    ['Branch', operations.branches.length, () => prisma.branch.count()],
    ['Employee', operations.employees.length, () => prisma.employee.count()],
    ['Gate', operations.gates.length, () => prisma.gate.count()],
    ['Member', operations.members.length, () => prisma.member.count()],
    [
      'MembershipPlan',
      operations.membershipPlans.length,
      () => prisma.membershipPlan.count(),
    ],
    [
      'Membership',
      operations.memberships.length,
      () => prisma.membership.count(),
    ],
    ['Freeze', operations.freezes.length, () => prisma.freeze.count()],
    ['Visit', operations.visits.length, () => prisma.visit.count()],
    ['Payment', operations.payments.length, () => prisma.payment.count()],
    [
      'Notification',
      operations.notifications.length,
      () => prisma.notification.count(),
    ],
    [
      'TenantSettings',
      settings.tenants.length,
      () => prisma.tenantSettings.count(),
    ],
    ['User', auth.users.length, () => prisma.user.count()],
  ];

  let mismatch = false;
  console.log('\nRow-count verification:');
  for (const [name, expected, getCount] of checks) {
    const actual = await getCount();
    const ok = actual === expected;
    if (!ok) mismatch = true;
    console.log(
      `  ${ok ? 'OK  ' : 'FAIL'} ${name}: json=${expected} db=${actual}`,
    );
  }

  await prisma.$disconnect();

  if (mismatch) {
    throw new Error('Row-count mismatch detected — see output above.');
  }

  console.log('\nMigration completed successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
