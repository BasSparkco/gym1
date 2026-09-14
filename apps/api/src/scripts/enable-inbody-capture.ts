/**
 * One-off admin tool: turns on the InBody 270 diagnostic capture route for
 * one tenant and prints the URL to paste into that device's "Send results
 * to administrator server" setting. See inbody.md for the full plan.
 *
 * This is deliberately not exposed anywhere in the app UI — InBody capture
 * is a per-tenant add-on we turn on ourselves, not a TenantSettings toggle
 * a tenant can flip for themselves (see InbodyCapture model comment).
 *
 * Usage (build-then-run pattern, see backfill-member-debt.ts):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/enable-inbody-capture.js <tenantId> <publicApiBaseUrl>
 *
 * Example:
 *   node --env-file=.env apps/api/dist/scripts/enable-inbody-capture.js tenant-spark-gym https://gym.sparkco.vip
 *
 * Re-running for the same tenant rotates the secret (old URL stops working)
 * and re-enables capture — handy to disable-then-reissue, or just flip
 * `enabled` back off directly in the DB when the trial is done.
 */

import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

async function main() {
  const tenantId = process.argv[2];
  const baseUrl = process.argv[3];
  if (!tenantId || !baseUrl) {
    console.error('Usage: node dist/scripts/enable-inbody-capture.js <tenantId> <publicApiBaseUrl>');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true } });
    if (!tenant) {
      console.error(`No tenant with id ${tenantId}.`);
      process.exit(1);
    }

    const secret = randomBytes(24).toString('hex');
    await prisma.inbodyCapture.upsert({
      where: { tenantId },
      create: { tenantId, secret, enabled: true },
      update: { secret, enabled: true, totalBytes: 0 },
    });

    const url = `${baseUrl.replace(/\/$/, '')}/api/inbody-capture/${secret}`;
    console.log(`Capture enabled for ${tenant.name} (${tenant.id}).`);
    console.log(`\nDevice URL (private — paste into the InBody 270's admin server field only):\n  ${url}\n`);
    console.log('Do not commit this URL or share it outside the person configuring the device.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
