/**
 * One-off broadcast for Platinum RSA's 268 currently-active members,
 * announcing the new system + app download links + their personal QR
 * code, via WhatsApp. Requested 2026-09-12 to go out 7:00-9:00 AM Israel
 * time, sent slowly (one member every ~20s) since it's a single WhatsApp
 * Web-backed number, not a bulk API — matches the same
 * channel:'whatsapp', mediaUrl:<qr> shape as MembersService.sendQrViaWhatsApp
 * (members.service.ts:903), just with a broadcast message instead of the
 * QR-only template, and its own client-side pacing loop.
 *
 * [اسم الفرع] in the template is replaced with each member's actual home
 * branch name ("Platinum Fitness" / "Platinum Women").
 *
 * Idempotent: appends one JSON line per attempt to a progress log
 * (PROGRESS_LOG) and skips memberIds already marked "sent" there on a
 * rerun, so an interrupted run can safely be restarted.
 *
 * Modes:
 *   dry-run           — print recipient count + sample rendered messages, no sends.
 *   test <phone>       — send ONE real message (a real active member's data,
 *                         redirected to <phone> instead of their own number)
 *                         to verify the full pipeline before the real batch.
 *   send               — the real batch: all active members with a phone.
 *
 * Run (build-then-run pattern, see backfill-member-debt.ts):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/send-migration-announcement.js <dry-run|test <phone>|send>
 */

import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { makeQrPublicUrl } from '../common/qr';

const TENANT_ID = 'tenant-ce5491e6-18a0-4397-a6f2-208e1dd06ec4'; // Platinum RSA
const PROGRESS_LOG = '/app/migration-announcement-progress.jsonl';
const SEND_INTERVAL_MS = 20_000;

const MESSAGE_TEMPLATE = `السلام عليكم ورحمة الله وبركاته،

أعضاءنا الكرام في [اسم الفرع]، 🌸

نسعد بإبلاغكم بأنه اعتباراً من اليوم بإذن الله سنبدأ العمل بالنظام الإلكتروني الجديد لبوابات النادي.

حرصاً على تقديم أفضل خدمة وبأعلى سلاسة، يرجى التكرم بالاطلاع على التفاصيل التالية والدخول عبر النظام الجديد:

1️⃣ تطبيق الهواتف الذكية:
يمكنكم الآن تحميل تطبيق النادي للاستفادة من الخدمات ورمز الدخول:

📲 أجهزة أندرويد (Android):

اضغط هنا لتحميل التطبيق
https://acesse.one/kzp4v0v

🍎 أجهزة آيفون (iPhone):

اضغط هنا لفتح الرابط
https://gymapp.sparkco.vip/

(تنويه: يرجى إضافة الرابط كرمز/أيقونة على الشاشة الرئيسية لتسهيل استخدامه كـ تطبيق).

2️⃣ رمز الدخول (QR Code):

تم إلغاء بيانات الدخول القديمة وتحديث النظام. مرفق في الاعلى رمز الـ QR Code الخاص بك للعبور عبر البوابات.

شاكرين لكم تعاونكم وتفهمكم، ونتمنى لكم تجربة مميزة دائماً! 🌟

مع تحيات إدارة النادي`;

function renderMessage(branchName: string): string {
  return MESSAGE_TEMPLATE.replace('[اسم الفرع]', branchName);
}

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

async function sendWhatsApp(
  apiKey: string,
  baseUrl: string,
  to: string,
  message: string,
  mediaUrl: string,
  sessionId: string,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch(`${baseUrl}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({
        channel: 'whatsapp',
        to,
        message,
        mediaUrl,
        sessionId,
      }),
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
      'Usage: node dist/scripts/send-migration-announcement.js <dry-run|test <phone>|send>',
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
        memberships: { some: { status: 'active' } },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        qrCode: true,
        homeBranchId: true,
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

    console.log(`Active members with a phone: ${activeMembers.length}`);
    const byBranch = new Map<string, number>();
    for (const m of activeMembers) {
      byBranch.set(m.homeBranchId, (byBranch.get(m.homeBranchId) ?? 0) + 1);
    }
    for (const [branchId, count] of byBranch) {
      console.log(`  ${branchNameById.get(branchId)}: ${count}`);
    }

    if (mode === 'dry-run') {
      console.log('\n=== Sample rendered messages (one per branch) ===');
      const seen = new Set<string>();
      for (const m of activeMembers) {
        if (seen.has(m.homeBranchId)) continue;
        seen.add(m.homeBranchId);
        const branchName = branchNameById.get(m.homeBranchId) ?? '';
        console.log(`\n--- ${branchName} sample (member ${m.fullName}) ---`);
        console.log(renderMessage(branchName));
        console.log(`[QR image attached: ${makeQrPublicUrl(m.id)}]`);
      }
      console.log(
        `\nEstimated duration at ${SEND_INTERVAL_MS / 1000}s/message: ${((activeMembers.length * SEND_INTERVAL_MS) / 60000).toFixed(0)} minutes.`,
      );
      return;
    }

    if (mode === 'test') {
      const testPhone = process.argv[3];
      if (!testPhone) {
        console.error(
          'Usage: node dist/scripts/send-migration-announcement.js test <phone>',
        );
        process.exit(1);
      }
      const sample =
        activeMembers.find(
          (m) =>
            m.homeBranchId ===
            branches.find((b) => b.name === 'Platinum Fitness')?.id,
        ) ?? activeMembers[0];
      const branchName = branchNameById.get(sample.homeBranchId) ?? '';
      const message = renderMessage(branchName);
      const qrUrl = makeQrPublicUrl(sample.id);
      const sessionId = sessionIdByBranch.get(sample.homeBranchId)!;
      console.log(
        `Sending test to ${testPhone} using real data from member ${sample.fullName} (${branchName})...`,
      );
      const result = await sendWhatsApp(
        apiKey,
        baseUrl,
        testPhone,
        message,
        qrUrl,
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
      const branchName = branchNameById.get(member.homeBranchId) ?? '';
      const message = renderMessage(branchName);
      const qrUrl = makeQrPublicUrl(member.id);
      const sessionId = sessionIdByBranch.get(member.homeBranchId)!;
      const result = await sendWhatsApp(
        apiKey,
        baseUrl,
        member.phone!,
        message,
        qrUrl,
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
