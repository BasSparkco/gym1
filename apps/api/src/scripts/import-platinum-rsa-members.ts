/**
 * One-off import of the old system's "active members.csv" export into the
 * Platinum RSA tenant, split by sex into its two branches.
 *
 * active members.csv columns (Arabic): رقم المشترك, اسم المشترك, رقم الهاتف,
 * العنوان, عدد الإشتراكات, الدين, تاريخ أخر إشتراك ("<start> - <end>"), العضوية
 * (plan name, free text from the old system).
 *
 * female.csv (same shape as the earlier import-members-csv.ts source: رقم
 * المشترك, اسم المشترك, رقم الهاتف, رقم الهوية, العنوان, الجنس, الطول,
 * تاريخ الإنضمام, تاريخ الميلاد, عدد الإشتراكات) is the authoritative list of
 * which member ids are female — every id in it is also present in active
 * members.csv. Anyone in active members.csv NOT in female.csv is treated as
 * male. female.csv also carries richer profile fields (id number, height,
 * DOB, join date) that active members.csv doesn't have, so female rows get
 * those merged in.
 *
 * Plan-name text in the old system is messy (discount/student variants,
 * inconsistent spelling of "3 months" etc.) and doesn't carry a price, so
 * rather than inventing new discounted plan rows we bucket each row's
 * "العضوية" text by duration keyword (سنة→365d, "6"→180d, "3"→90d, "شهر"→30d)
 * and attach it to the one existing Platinum RSA plan of that duration
 * (PLAN_BY_DURATION below — hand-picked since some durations have more than
 * one plan, e.g. 30d also matches the kickboxing plans). Rows whose plan
 * text matches none of those keywords (blank, or the single one-off
 * "10 visits private" row) get a Member profile only, no Membership.
 *
 * Membership.finalPrice is the matched plan's list price; a Payment for
 * (finalPrice - sheet debt) is recorded so the member's cached debt lands
 * exactly on the sheet's "الدين" value once Member.debt is set to it
 * directly (equivalent to DebtService.recompute() given these are the only
 * charge/payment rows for the member).
 *
 * Not idempotent — re-running creates duplicates. Everything happens in one
 * transaction: either the whole file imports or nothing does.
 *
 * Run (build-then-run pattern, see backfill-member-debt.ts):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/import-platinum-rsa-members.js \
 *     <active-members.csv> <female.csv> [--dry-run]
 */

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Sex,
  MembershipStatus,
  Prisma,
} from '../generated/prisma/client';
import { normalizePhone } from '../common/phone';
import { findCountryByCode } from '../data/countries';
import { memberNumberPrefix, nextSequenceFromNumbers, formatOrgNumber } from '../common/org-numbering';

const TENANT_ID = 'tenant-ce5491e6-18a0-4397-a6f2-208e1dd06ec4'; // Platinum RSA
const MEN_BRANCH_ID = 'branch-38e36b2c-39dc-4598-9a6f-b68106a3eae2'; // Platinum Fitness
const WOMEN_BRANCH_ID = 'branch-b7e80d36-e69c-4b86-afe9-433e96f8319b'; // Platinum Women

const PLAN_BY_DURATION: Record<number, { id: string; price: number }> = {
  30: { id: 'plan-230629dd-67b1-4aee-9407-73c4f41adece', price: 400 }, // اشتراك شهر
  90: { id: 'plan-3c6ecc46-dac5-4dc9-9e9b-543dc6f75be0', price: 900 }, // اشتراك 3 ا شهر
  180: { id: 'plan-c20722f3-40d3-48b6-ae47-efd066023df7', price: 1500 }, // اشتراك 6 اشهر
  365: { id: 'plan-94ebc19f-6db3-4f5a-8337-6100f2eed361', price: 2800 }, // اشتراك سنه
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r') {
      // skip
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function parseUsDate(s: string): Date | undefined {
  const trimmed = s.trim();
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return undefined;
  const [, mm, dd, yyyy] = m;
  return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
}

function parseSheetDate(s: string): Date | undefined {
  const trimmed = s.trim();
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return undefined;
  const [, yyyy, mm, dd] = m;
  return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
}

function parseDateRange(s: string): { start: Date; end: Date } | undefined {
  const parts = s.split(' - ').map((p) => p.trim());
  if (parts.length !== 2) return undefined;
  const start = parseSheetDate(parts[0]);
  const end = parseSheetDate(parts[1]);
  if (!start || !end) return undefined;
  return { start, end };
}

function bucketDuration(planText: string): number | undefined {
  const norm = planText.trim();
  if (!norm) return undefined;
  if (norm.includes('سنة') || norm.includes('سنه')) return 365;
  if (norm.includes('6')) return 180;
  if (norm.includes('3')) return 90;
  if (norm.includes('شهر')) return 30;
  return undefined;
}

interface FemaleRow {
  idNumber?: string;
  address?: string;
  height?: number;
  joinDate?: Date;
  dateOfBirth?: Date;
}

async function main() {
  const activeCsvPath = process.argv[2];
  const femaleCsvPath = process.argv[3];
  const dryRun = process.argv.includes('--dry-run');
  if (!activeCsvPath || !femaleCsvPath) {
    console.error(
      'Usage: node dist/scripts/import-platinum-rsa-members.js <active-members.csv> <female.csv> [--dry-run]',
    );
    process.exit(1);
  }

  const activeRows = parseCsv(readFileSync(activeCsvPath, 'utf-8'));
  const [, ...activeData] = activeRows;
  const femaleRows = parseCsv(readFileSync(femaleCsvPath, 'utf-8'));
  const [, ...femaleData] = femaleRows;

  const femaleById = new Map<string, FemaleRow>();
  for (const r of femaleData) {
    const id = r[0]?.trim();
    if (!id) continue;
    femaleById.set(id, {
      idNumber: r[3]?.trim() || undefined,
      address: r[4]?.trim() || undefined,
      height: r[6]?.trim() ? Number(r[6]) : undefined,
      joinDate: parseUsDate(r[7] ?? ''),
      dateOfBirth: parseUsDate(r[8] ?? ''),
    });
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const [menBranch, womenBranch] = await Promise.all([
      prisma.branch.findFirstOrThrow({ where: { id: MEN_BRANCH_ID, tenantId: TENANT_ID } }),
      prisma.branch.findFirstOrThrow({ where: { id: WOMEN_BRANCH_ID, tenantId: TENANT_ID } }),
    ]);
    const dialCode = findCountryByCode(menBranch.countryCode ?? '')?.dialCode;

    const existing = await prisma.member.findMany({
      where: { tenantId: TENANT_ID },
      select: { memberNumber: true, phone: true },
    });
    const tenant = await prisma.tenant.findUnique({
      where: { id: TENANT_ID },
      select: { code: true },
    });
    const prefix = memberNumberPrefix(tenant?.code ?? null);
    let nextSequence = nextSequenceFromNumbers(existing.map((m) => m.memberNumber), prefix);
    const existingPhones = new Set(existing.map((m) => m.phone).filter(Boolean));

    const today = new Date();

    let toCreate = 0;
    let withMembership = 0;
    let profileOnly = 0;
    let skippedNoName = 0;
    let duplicatePhone = 0;
    let femaleCount = 0;
    let maleCount = 0;

    const ops: Array<(tx: Prisma.TransactionClient) => Promise<void>> = [];

    for (const row of activeData) {
      const id = row[0]?.trim();
      const fullName = row[1]?.trim();
      const phoneRaw = row[2]?.trim();
      const address = row[3]?.trim();
      const debt = Number(row[5]?.trim() || '0') || 0;
      const dateRange = parseDateRange(row[6] ?? '');
      const planText = row[7] ?? '';

      if (!fullName) {
        skippedNoName++;
        continue;
      }

      const female = id ? femaleById.get(id) : undefined;
      const sex: Sex = female ? 'female' : 'male';
      if (female) femaleCount++;
      else maleCount++;

      const branchId = female ? WOMEN_BRANCH_ID : MEN_BRANCH_ID;
      const phone = normalizePhone(phoneRaw, dialCode);
      if (phone && existingPhones.has(phone)) duplicatePhone++;

      const memberNumber = formatOrgNumber(prefix, nextSequence);
      nextSequence++;
      const memberId = `member-${randomUUID()}`;

      const duration = dateRange ? bucketDuration(planText) : undefined;
      const plan = duration ? PLAN_BY_DURATION[duration] : undefined;

      if (plan && dateRange) withMembership++;
      else profileOnly++;
      toCreate++;

      ops.push(async (tx) => {
        await tx.member.create({
          data: {
            id: memberId,
            tenantId: TENANT_ID,
            homeBranchId: branchId,
            memberNumber,
            fullName,
            status: 'active',
            phone,
            idNumber: female?.idNumber,
            address: address || female?.address,
            sex,
            height: female?.height,
            joinDate: female?.joinDate,
            dateOfBirth: female?.dateOfBirth,
            debt: new Prisma.Decimal(debt),
          },
        });

        if (plan && dateRange) {
          const membershipId = `membership-${randomUUID()}`;
          const status: MembershipStatus =
            dateRange.end < today ? 'expired' : dateRange.start > today ? 'draft' : 'active';

          await tx.membership.create({
            data: {
              id: membershipId,
              memberId,
              planId: plan.id,
              startDate: dateRange.start,
              endDate: dateRange.end,
              status,
              finalPrice: new Prisma.Decimal(plan.price),
            },
          });

          const paid = Math.max(0, plan.price - debt);
          if (paid > 0) {
            await tx.payment.create({
              data: {
                id: `payment-${randomUUID()}`,
                tenantId: TENANT_ID,
                branchId,
                memberId,
                membershipId,
                amount: new Prisma.Decimal(paid),
                paymentDate: dateRange.start,
                status: 'paid',
                paymentMethod: 'cash',
              },
            });
          }
        }
      });
    }

    console.log(`Parsed ${activeData.length} row(s) from ${activeCsvPath}.`);
    console.log(`  Skipped (no name): ${skippedNoName}`);
    console.log(`  To create: ${toCreate} (male: ${maleCount}, female: ${femaleCount})`);
    console.log(`  With Membership+Payment: ${withMembership}`);
    console.log(`  Profile only (no matching plan text): ${profileOnly}`);
    console.log(`  Phone numbers already present in tenant: ${duplicatePhone}`);
    console.log(`  memberNumber range: ${formatOrgNumber(prefix, nextSequence - toCreate)}..${formatOrgNumber(prefix, nextSequence - 1)}`);

    if (dryRun) {
      console.log('\nDry run — no rows written.');
      return;
    }

    await prisma.$transaction(
      async (tx) => {
        for (const op of ops) {
          await op(tx);
        }
      },
      { timeout: 120_000 },
    );

    console.log(`\nDone. Imported ${toCreate} member(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
