/**
 * One-off broadcast: sends each currently-active Platinum RSA member their
 * app sign-in PIN (backfilled by backfill-member-pins.ts) over WhatsApp,
 * using the tenant's real 'memberPin' notification template (Arabic —
 * matches Platinum RSA's tenant defaultLanguage, same template shown at
 * /settings/notifications/templates under "Your mobile app PIN"), so the
 * wording matches exactly what the app would send automatically on new
 * member creation (see MembersService.issueAndSendPin, members.service.ts:578).
 *
 * Same shape and pacing as send-migration-announcement.ts (channel
 * 'whatsapp', one send every ~20s, JSONL progress log so a rerun skips
 * already-sent members) — just a plain-text message (no mediaUrl) instead
 * of the QR image.
 *
 * PF-0190 already had her PIN created and sent manually (she asked before
 * this batch existed) — excluded explicitly, on top of the active-only
 * filter already narrowing to the right group.
 *
 * Modes:
 *   dry-run      — print recipient count + a sample rendered message.
 *   test <phone> — send ONE real message (real member's data, redirected
 *                  to <phone>) to verify the template renders correctly.
 *   send         — the real batch.
 *
 * Run (build-then-run pattern, see backfill-member-debt.ts):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/send-member-pin.js <dry-run|test <phone>|send>
 */

import { existsSync, appendFileSync, readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { decryptPin } from '../common/pin-crypto';
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  renderNotificationTemplate,
} from '../data/notification-templates-seed';

const TENANT_ID = 'tenant-ce5491e6-18a0-4397-a6f2-208e1dd06ec4'; // Platinum RSA
const EXCLUDE_MEMBER_NUMBER = 'PF-0190';
const PROGRESS_LOG = '/app/member-pin-send-progress.jsonl';
const SEND_INTERVAL_MS = 20_000;
const FROM_LABEL_AR = 'من';

function loadAlreadySent(): Set<string> {
  if (!existsSync(PROGRESS_LOG)) return new Set();
  const lines = readFileSync(PROGRESS_LOG, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean);
  const sent = new Set<string>();
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.status === 'sent') sent.add(entry.memberId);
    } catch {
      // skip malformed line
    }
  }
  return sent;
}

function logProgress(entry: Record<string, unknown>) {
  appendFileSync(
    PROGRESS_LOG,
    JSON.stringify({ ...entry, at: new Date().toISOString() }) + '\n',
  );
}

async function renderPinMessage(
  prisma: PrismaClient,
  memberName: string,
  pin: string,
  branchName: string,
): Promise<string> {
  const override = await prisma.notificationTemplate.findUnique({
    where: {
      tenantId_templateKey_lang: {
        tenantId: TENANT_ID,
        templateKey: 'memberPin',
        lang: 'ar',
      },
    },
  });
  const base =
    override ?? DEFAULT_NOTIFICATION_TEMPLATES.memberPin.translations.ar;
  const body = renderNotificationTemplate(base.body, { memberName, pin });
  return `${FROM_LABEL_AR}: ${branchName}\n\n${body}`;
}

async function sendWhatsApp(
  apiKey: string,
  baseUrl: string,
  to: string,
  message: string,
  sessionId: string,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch(`${baseUrl}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ channel: 'whatsapp', to, message, sessionId }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, reason: `HTTP ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: (err as Error).message };
  }
}

async function resolveSessionId(
  prisma: PrismaClient,
  branchId: string,
): Promise<string> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { tenantId: true, isMain: true, useMainBranchWhatsapp: true },
  });
  if (!branch || branch.isMain || !branch.useMainBranchWhatsapp)
    return branchId;
  const mainBranch = await prisma.branch.findFirst({
    where: { tenantId: branch.tenantId, isMain: true },
    select: { id: true },
  });
  return mainBranch?.id ?? branchId;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const mode = process.argv[2];
  if (!['dry-run', 'test', 'send'].includes(mode ?? '')) {
    console.error(
      'Usage: node dist/scripts/send-member-pin.js <dry-run|test <phone>|send>',
    );
    process.exit(1);
  }

  const apiKey = process.env.SPARKCO_API_KEY;
  const baseUrl =
    process.env.SPARKCO_API_URL ?? 'https://api.sparkco.vip/api/v1';
  if (!apiKey) {
    console.error('SPARKCO_API_KEY not set.');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const activeMembers = await prisma.member.findMany({
      where: {
        tenantId: TENANT_ID,
        phone: { not: null },
        pinEncrypted: { not: null },
        memberNumber: { not: EXCLUDE_MEMBER_NUMBER },
        memberships: { some: { status: 'active' } },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        pinEncrypted: true,
        homeBranchId: true,
        memberNumber: true,
      },
    });

    const branches = await prisma.branch.findMany({
      where: { tenantId: TENANT_ID },
      select: { id: true, name: true },
    });
    const branchNameById = new Map(branches.map((b) => [b.id, b.name]));
    const sessionIdByBranch = new Map<string, string>();
    for (const b of branches)
      sessionIdByBranch.set(b.id, await resolveSessionId(prisma, b.id));

    console.log(`Active members to send PIN to: ${activeMembers.length}`);
    const byBranch = new Map<string, number>();
    for (const m of activeMembers)
      byBranch.set(m.homeBranchId, (byBranch.get(m.homeBranchId) ?? 0) + 1);
    for (const [branchId, count] of byBranch)
      console.log(`  ${branchNameById.get(branchId)}: ${count}`);

    if (mode === 'dry-run') {
      const sample = activeMembers[0];
      const pin = decryptPin(sample.pinEncrypted!);
      if (!pin)
        throw new Error(
          'Failed to decrypt sample PIN — check PIN_ENCRYPTION_KEY.',
        );
      const message = await renderPinMessage(
        prisma,
        sample.fullName,
        pin,
        branchNameById.get(sample.homeBranchId) ?? '',
      );
      console.log(
        `\n=== Sample rendered message (member ${sample.fullName}) ===\n${message}`,
      );
      console.log(
        `\nEstimated duration at ${SEND_INTERVAL_MS / 1000}s/message: ${((activeMembers.length * SEND_INTERVAL_MS) / 60000).toFixed(0)} minutes.`,
      );
      return;
    }

    if (mode === 'test') {
      const testPhone = process.argv[3];
      if (!testPhone) {
        console.error(
          'Usage: node dist/scripts/send-member-pin.js test <phone>',
        );
        process.exit(1);
      }
      const sample = activeMembers[0];
      const pin = decryptPin(sample.pinEncrypted!);
      if (!pin) throw new Error('Failed to decrypt sample PIN.');
      const branchName = branchNameById.get(sample.homeBranchId) ?? '';
      const message = await renderPinMessage(
        prisma,
        sample.fullName,
        pin,
        branchName,
      );
      const sessionId = sessionIdByBranch.get(sample.homeBranchId)!;
      console.log(
        `Sending test to ${testPhone} using real data from member ${sample.fullName} (${branchName})...`,
      );
      const result = await sendWhatsApp(
        apiKey,
        baseUrl,
        testPhone,
        message,
        sessionId,
      );
      console.log('Result:', JSON.stringify(result));
      return;
    }

    // mode === 'send'
    const alreadySent = loadAlreadySent();
    console.log(`Already sent (from prior run): ${alreadySent.size}`);
    const toSend = activeMembers.filter((m) => !alreadySent.has(m.id));
    console.log(`Remaining to send: ${toSend.length}`);

    let sent = 0;
    let failed = 0;
    for (const member of toSend) {
      const pin = decryptPin(member.pinEncrypted!);
      if (!pin) {
        failed++;
        logProgress({
          memberId: member.id,
          phone: member.phone,
          status: 'failed',
          reason: 'decrypt failed',
        });
        console.warn(
          `[${sent + failed}/${toSend.length}] FAILED (decrypt) -> ${member.fullName}`,
        );
        if (member !== toSend[toSend.length - 1]) await sleep(SEND_INTERVAL_MS);
        continue;
      }
      const branchName = branchNameById.get(member.homeBranchId) ?? '';
      const message = await renderPinMessage(
        prisma,
        member.fullName,
        pin,
        branchName,
      );
      const sessionId = sessionIdByBranch.get(member.homeBranchId)!;
      const result = await sendWhatsApp(
        apiKey,
        baseUrl,
        member.phone!,
        message,
        sessionId,
      );
      if (result.ok) {
        sent++;
        logProgress({
          memberId: member.id,
          phone: member.phone,
          status: 'sent',
        });
        console.log(
          `[${sent + failed}/${toSend.length}] OK -> ${member.fullName}`,
        );
      } else {
        failed++;
        logProgress({
          memberId: member.id,
          phone: member.phone,
          status: 'failed',
          reason: result.reason,
        });
        console.warn(
          `[${sent + failed}/${toSend.length}] FAILED -> ${member.fullName}: ${result.reason}`,
        );
      }
      if (member !== toSend[toSend.length - 1]) await sleep(SEND_INTERVAL_MS);
    }

    console.log(`\nDone. Sent ${sent}, failed ${failed}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
