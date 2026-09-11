/**
 * One-off reset of both Platinum RSA BAS-IP gate devices' local identifier
 * lists, run on a holiday closure day (2026-09-11, confirmed empty gym) so
 * nobody is mid-scan while the list is briefly empty:
 *
 *   1. list   — dump every identifier currently on each device (audit trail
 *      before deleting anything — see gates.md's "don't wipe blind" note).
 *   2. clear  — delete everything dumped in step 1 from that device.
 *   3. employees — push all 15 Platinum RSA employees' QR to BOTH gates
 *      (explicit owner instruction: staff should open either door,
 *      overriding each employee's normal `gateAccessScope`-based routing).
 *   4. members — push every member with a currently-active membership to
 *      their OWN branch's gate only (Fitness=male gate, Women=female gate —
 *      already enforced by each gate's genderRestriction + each member's
 *      branch assignment, so no extra gender check needed here).
 *
 * Backfills Member.qrCode first for the ~1012 members imported by
 * reimport-platinum-rsa-members.ts, which wrote Member rows directly and
 * skipped the qrCode generation the normal member-creation path does
 * (members.service.ts) — without this, a future renewal's
 * `member.qrCode ?? memberIdToUuid(member.id)` fallback would push an
 * oversized (36-char) identifier that BAS-IP firmware may reject.
 *
 * Reuses BasIpSyncService as-is (same auth/push/remove logic the live app
 * uses) rather than re-implementing device calls here.
 *
 * Run (build-then-run pattern, see backfill-member-debt.ts):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/provision-platinum-rsa-gates.js <phase>
 * where <phase> is one of: list | clear | employees | members
 * Run in that order. Each phase is independent — inspect output before
 * moving to the next.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '../generated/prisma/client';
import { BasIpSyncService } from '../modules/access/bas-ip-sync.service';
import { generateShortCode } from '../common/qr';
import type { GateRecord } from '../data/operations-seed';

const TENANT_ID = 'tenant-ce5491e6-18a0-4397-a6f2-208e1dd06ec4'; // Platinum RSA

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function loadGates(prisma: PrismaClient): Promise<GateRecord[]> {
  const gates = await prisma.gate.findMany({ where: { tenantId: TENANT_ID } });
  return gates.map((g) => ({
    id: g.id,
    tenantId: g.tenantId,
    branchId: g.branchId,
    name: g.name,
    genderRestriction: g.genderRestriction,
    deviceUrl: g.deviceUrl,
    deviceUsername: g.deviceUsername,
    devicePassword: g.devicePassword,
    lockNumber: g.lockNumber,
    enabled: g.enabled,
  }));
}

async function phaseList(prisma: PrismaClient, sync: BasIpSyncService) {
  const gates = await loadGates(prisma);
  for (const gate of gates) {
    const items = await sync.listIdentifiers(gate);
    if (items === null) {
      console.error(`Gate ${gate.name} (${gate.id}): device unreachable, aborting.`);
      process.exit(1);
    }
    const file = `/tmp/gate-dump-${gate.id}-${Date.now()}.json`;
    writeFileSync(file, JSON.stringify(items, null, 2));
    console.log(`Gate ${gate.name}: ${items.length} identifier(s) currently on device. Dumped to ${file}`);
    const byType = new Map<string, number>();
    for (const it of items) byType.set(it.type, (byType.get(it.type) ?? 0) + 1);
    console.log(`  By type: ${JSON.stringify(Object.fromEntries(byType))}`);
  }
}

async function phaseClear(prisma: PrismaClient, sync: BasIpSyncService) {
  const gates = await loadGates(prisma);
  for (const gate of gates) {
    const items = await sync.listIdentifiers(gate);
    if (items === null) {
      console.error(`Gate ${gate.name} (${gate.id}): device unreachable, aborting.`);
      process.exit(1);
    }
    if (items.length === 0) {
      console.log(`Gate ${gate.name}: already empty.`);
      continue;
    }
    const file = `/tmp/gate-dump-before-clear-${gate.id}-${Date.now()}.json`;
    writeFileSync(file, JSON.stringify(items, null, 2));
    console.log(`Gate ${gate.name}: dumped ${items.length} identifier(s) to ${file} before clearing.`);
    const linkIds = items.map((it) => it.linkId);
    const ok = await sync.removeIdentifiers(linkIds, gate);
    console.log(`Gate ${gate.name}: removed ${linkIds.length} identifier(s) — ${ok ? 'ok' : 'FAILED'}`);

    const after = await sync.listIdentifiers(gate);
    console.log(
      `  Verification: ${after?.length ?? 'unknown'} identifier(s) remain via API` +
        ` — this device has shown eventually-consistent DELETEs before, so also check the device's own admin UI, don't trust this alone.`,
    );
  }
}

// pushEmployeeQrIdentifier/pushQrIdentifier return the device's identifier
// uid, looked up right after the push — but on these two live devices that
// lookup reliably returns null even when the push itself succeeded (known
// issue, see gates.md). So uid===null is NOT a reliable failure signal here;
// we push everything and verify actual gate state afterward via a fresh
// listIdentifiers() count instead of trusting each call's return value.
async function phaseEmployees(prisma: PrismaClient, sync: BasIpSyncService) {
  const gates = await loadGates(prisma);
  const employees = await prisma.employee.findMany({
    where: { tenantId: TENANT_ID, status: 'active' },
    select: { id: true, fullName: true, qrCode: true, employeeNumber: true },
  });
  console.log(`Pushing ${employees.length} employee(s) to ${gates.length} gate(s) each...`);

  let attempted = 0;
  let skippedNoQr = 0;
  for (const emp of employees) {
    if (!emp.qrCode) {
      console.warn(`  ${emp.employeeNumber} ${emp.fullName}: no qrCode set, skipping.`);
      skippedNoQr++;
      continue;
    }
    for (const gate of gates) {
      await sync.pushEmployeeQrIdentifier(emp.id, emp.fullName, emp.qrCode, gate);
      attempted++;
    }
  }
  console.log(`Sent ${attempted} push request(s), ${skippedNoQr} employee(s) skipped (no qrCode).`);

  for (const gate of gates) {
    const items = await sync.listIdentifiers(gate);
    console.log(`  Gate ${gate.name}: ${items?.length ?? 'unknown'} identifier(s) now on device.`);
  }
}

async function phaseMembers(prisma: PrismaClient, sync: BasIpSyncService) {
  const gates = await loadGates(prisma);
  const gateByBranch = new Map(gates.map((g) => [g.branchId, g]));

  const membersWithoutQr = await prisma.member.count({
    where: { tenantId: TENANT_ID, qrCode: null },
  });
  if (membersWithoutQr > 0) {
    console.log(`Backfilling qrCode for ${membersWithoutQr} member(s) missing one...`);
    const missing = await prisma.member.findMany({
      where: { tenantId: TENANT_ID, qrCode: null },
      select: { id: true },
    });
    for (const m of missing) {
      let code = generateShortCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await prisma.member.update({ where: { id: m.id }, data: { qrCode: code } });
          break;
        } catch (err: any) {
          if (err?.code === 'P2002') {
            code = generateShortCode();
            continue;
          }
          throw err;
        }
      }
    }
    console.log('Backfill done.');
  }

  const activeMembers = await prisma.member.findMany({
    where: {
      tenantId: TENANT_ID,
      memberships: { some: { status: 'active' } },
    },
    select: {
      id: true,
      fullName: true,
      qrCode: true,
      homeBranchId: true,
      memberships: {
        where: { status: 'active' },
        select: { startDate: true, endDate: true },
        take: 1,
      },
    },
  });

  console.log(`Pushing ${activeMembers.length} active member(s) to their home branch's gate...`);

  let attempted = 0;
  let skipped = 0;
  let noGate = 0;
  for (const member of activeMembers) {
    const gate = gateByBranch.get(member.homeBranchId);
    if (!gate) {
      noGate++;
      continue;
    }
    const membership = member.memberships[0];
    if (!membership || !member.qrCode) {
      skipped++;
      continue;
    }
    await sync.pushQrIdentifier(
      member.id,
      member.fullName,
      member.qrCode,
      toDateStr(membership.startDate),
      toDateStr(membership.endDate),
      gate,
    );
    attempted++;
  }
  console.log(`Sent ${attempted} push request(s), ${skipped} skipped (no membership/qrCode), ${noGate} with no matching gate for their branch.`);

  for (const gate of gates) {
    const items = await sync.listIdentifiers(gate);
    console.log(`  Gate ${gate.name}: ${items?.length ?? 'unknown'} identifier(s) now on device.`);
  }
}

async function main() {
  const phase = process.argv[2];
  if (!['list', 'clear', 'employees', 'members'].includes(phase ?? '')) {
    console.error('Usage: node dist/scripts/provision-platinum-rsa-gates.js <list|clear|employees|members>');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const sync = new BasIpSyncService();

  try {
    if (phase === 'list') await phaseList(prisma, sync);
    else if (phase === 'clear') await phaseClear(prisma, sync);
    else if (phase === 'employees') await phaseEmployees(prisma, sync);
    else if (phase === 'members') await phaseMembers(prisma, sync);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
