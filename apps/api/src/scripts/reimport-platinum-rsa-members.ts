/**
 * Deletes Platinum RSA's current 271 members (imported from the old
 * system's export, never used for real gate/app activity — 0 visits) and
 * replaces them with the full 1012-row members.csv the org just sent,
 * split by the `sex` column into the tenant's two branches.
 *
 * members.csv columns: number, fullName, sex (ذكر/أنثى), dateOfBirth,
 * height, idNumber, phone, Area, joinDate, MembershipCount, Debt,
 * MemberShipStart, MemberShipEnd, MembershipPlan, active/inactive.
 *
 * Decisions confirmed with the org owner (2026-09-11):
 * - 13 rows with a malformed phone (not 05XXXXXXXX) import with phone=null
 *   rather than a guessed normalization.
 * - Blank idNumber/phone otherwise import as null — to be corrected later.
 * - MembershipPlan free text is a pricing/discount label, not a distinct
 *   product — the actual duration is read from MemberShipStart/End and
 *   matched to the nearest of Platinum RSA's existing duration plans
 *   (PLAN_BY_DURATION below), same bucketing this tenant's original import
 *   script used, except duration comes from real dates here instead of
 *   keyword-matching messy plan text. "رقص شرقي" rows map by name instead
 *   (that plan has no fixed duration). Discount modeling (DiscountType) is
 *   deliberately NOT applied — we don't have the actual sold price, only
 *   the sheet's list-price-equivalent duration and remaining debt, so
 *   inventing a discount percentage would fabricate financial data.
 * - A row's date range is trusted only if both dates parse, fall within
 *   1900-2100, and end >= start; otherwise (10 rows: a few with end before
 *   start, one with a "0006" year typo) the member still imports, just
 *   without a Membership/Payment — these are old, already-expired cycles
 *   anyway.
 * - The 3 members with a mobile-app PIN and the 7 with message threads
 *   are fine to lose — org owner confirmed delete-all.
 * - BAS-IP gate QR deprovisioning is a deliberately separate, later step
 *   (see gates.md) — this script does not touch the physical devices.
 *
 * Not idempotent — re-running deletes+recreates again. Delete and import
 * happen in one transaction: either both happen or neither does.
 *
 * Run (build-then-run pattern, see backfill-member-debt.ts):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/reimport-platinum-rsa-members.js \
 *     <members.csv> [--dry-run]
 */

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Sex,
  MemberStatus,
  MembershipStatus,
  Prisma,
} from '../generated/prisma/client';
import { normalizePhone } from '../common/phone';
import { findCountryByCode } from '../data/countries';
import { memberNumberPrefix, formatOrgNumber } from '../common/org-numbering';

const TENANT_ID = 'tenant-ce5491e6-18a0-4397-a6f2-208e1dd06ec4'; // Platinum RSA
const MEN_BRANCH_ID = 'branch-38e36b2c-39dc-4598-9a6f-b68106a3eae2'; // Platinum Fitness
const WOMEN_BRANCH_ID = 'branch-b7e80d36-e69c-4b86-afe9-433e96f8319b'; // Platinum Women

const PLAN_BY_DURATION: Record<number, string> = {
  30: 'plan-230629dd-67b1-4aee-9407-73c4f41adece', // اشتراك شهر
  60: 'plan-7b08fbd4-10b6-4f8e-af6e-d1fe5857e2c9', // اشتراك 2 اشهر
  90: 'plan-3c6ecc46-dac5-4dc9-9e9b-543dc6f75be0', // اشتراك 3 ا شهر
  180: 'plan-c20722f3-40d3-48b6-ae47-efd066023df7', // اشتراك 6 اشهر
  365: 'plan-94ebc19f-6db3-4f5a-8337-6100f2eed361', // اشتراك سنه
};
const DANCE_PLAN_ID = 'plan-3856cb29-262b-4981-9575-083528735ecc'; // رقص شرقي
const DURATION_BUCKETS = [30, 60, 90, 180, 365];
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

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

// Sheet dates are "YYYY-MM-DD HH:MM:SS" (time always 00:00:00). Returns
// undefined for blank/unparseable/out-of-range values instead of throwing,
// so one bad row degrades to a missing date rather than aborting the import.
function parseSheetDate(s: string | undefined): Date | undefined {
  const trimmed = (s ?? '').trim();
  if (!trimmed) return undefined;
  const m = trimmed.match(/^(\d{1,4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const [, yyyy, mm, dd] = m;
  const year = Number(yyyy);
  if (year < MIN_YEAR || year > MAX_YEAR) return undefined;
  const date = new Date(Date.UTC(year, Number(mm) - 1, Number(dd)));
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

const VALID_PHONE = /^05\d{8}$/;

function cleanPhone(raw: string | undefined): string | undefined {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return undefined;
  const digits = trimmed.replace(/\D/g, '');
  if (!VALID_PHONE.test(digits)) return undefined; // malformed — import without a phone
  return digits;
}

function nearestDuration(days: number): number {
  return DURATION_BUCKETS.reduce((best, b) =>
    Math.abs(b - days) < Math.abs(best - days) ? b : best,
  );
}

interface Row {
  fullName: string;
  sex: string;
  dateOfBirth: string;
  height: string;
  idNumber: string;
  phone: string;
  area: string;
  joinDate: string;
  debt: string;
  membershipStart: string;
  membershipEnd: string;
  membershipPlan: string;
  activeInactive: string;
}

function toRow(header: string[], values: string[]): Row {
  const get = (name: string) => values[header.indexOf(name)] ?? '';
  return {
    fullName: get('fullName').trim(),
    sex: get('sex').trim(),
    dateOfBirth: get('dateOfBirth'),
    height: get('height').trim(),
    idNumber: get('idNumber').trim(),
    phone: get('phone'),
    area: get('Area').trim(),
    joinDate: get('joinDate'),
    debt: get('Debt').trim(),
    membershipStart: get('MemberShipStart'),
    membershipEnd: get('MemberShipEnd'),
    membershipPlan: get('MembershipPlan').trim(),
    activeInactive: get('active/inactive').trim(),
  };
}

async function main() {
  const csvPath = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');
  if (!csvPath) {
    console.error(
      'Usage: node dist/scripts/reimport-platinum-rsa-members.js <members.csv> [--dry-run]',
    );
    process.exit(1);
  }

  const allRows = parseCsv(readFileSync(csvPath, 'utf-8'));
  const [header, ...data] = allRows;

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const [menBranch, womenBranch, tenant, areas] = await Promise.all([
      prisma.branch.findFirstOrThrow({ where: { id: MEN_BRANCH_ID, tenantId: TENANT_ID } }),
      prisma.branch.findFirstOrThrow({ where: { id: WOMEN_BRANCH_ID, tenantId: TENANT_ID } }),
      prisma.tenant.findUniqueOrThrow({ where: { id: TENANT_ID }, select: { code: true } }),
      prisma.area.findMany({ where: { tenantId: TENANT_ID }, select: { id: true, name: true } }),
    ]);
    const dialCode = findCountryByCode(menBranch.countryCode ?? '')?.dialCode;
    const areaIdByName = new Map(areas.map((a) => [a.name, a.id]));

    const existingMembers = await prisma.member.findMany({
      where: { tenantId: TENANT_ID },
      select: { id: true },
    });
    const prefix = memberNumberPrefix(tenant.code);

    const today = new Date();

    let toCreate = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let withMembership = 0;
    let profileOnly = 0;
    let danceCount = 0;
    let skippedNoName = 0;
    let skippedUnknownSex = 0;
    let skippedNoArea = 0;
    let phoneNulled = 0;
    let badDateRange = 0;
    let sequence = 1;

    const ops: Array<(tx: Prisma.TransactionClient) => Promise<void>> = [];

    for (const values of data) {
      const row = toRow(header, values);
      if (!row.fullName) {
        skippedNoName++;
        continue;
      }

      let sex: Sex;
      let branchId: string;
      if (row.sex === 'ذكر') {
        sex = 'male';
        branchId = MEN_BRANCH_ID;
        maleCount++;
      } else if (row.sex === 'أنثى') {
        sex = 'female';
        branchId = WOMEN_BRANCH_ID;
        femaleCount++;
      } else {
        skippedUnknownSex++;
        continue;
      }

      const rawPhone = row.phone.trim();
      const cleaned = cleanPhone(rawPhone);
      if (rawPhone && !cleaned) phoneNulled++;
      const phone = cleaned ? normalizePhone(cleaned, dialCode) : undefined;

      let areaId: string | undefined;
      if (row.area) {
        areaId = areaIdByName.get(row.area);
        if (!areaId) skippedNoArea++; // shouldn't happen — every sheet area matched an existing one at analysis time
      }

      const status: MemberStatus = row.activeInactive === 'active' ? 'active' : 'inactive';
      const debt = Number(row.debt || '0') || 0;

      const start = parseSheetDate(row.membershipStart);
      const end = parseSheetDate(row.membershipEnd);
      const isDance = row.membershipPlan.includes('رقص');
      let planId: string | undefined;
      let planDays: number | undefined;
      if (start && end && end >= start) {
        if (isDance) {
          planId = DANCE_PLAN_ID;
        } else {
          const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
          planDays = nearestDuration(days);
          planId = PLAN_BY_DURATION[planDays];
        }
      } else if (row.membershipStart.trim() || row.membershipEnd.trim()) {
        badDateRange++;
      }

      const memberNumber = formatOrgNumber(prefix, sequence);
      sequence++;
      const memberId = `member-${randomUUID()}`;
      toCreate++;

      ops.push(async (tx) => {
        await tx.member.create({
          data: {
            id: memberId,
            tenantId: TENANT_ID,
            homeBranchId: branchId,
            memberNumber,
            fullName: row.fullName,
            status,
            phone,
            idNumber: row.idNumber || undefined,
            sex,
            areaId,
            joinDate: parseSheetDate(row.joinDate),
            dateOfBirth: parseSheetDate(row.dateOfBirth),
            height: row.height ? Number(row.height) : undefined,
            debt: new Prisma.Decimal(debt),
          },
        });

        if (planId) {
          const plan = await tx.membershipPlan.findUniqueOrThrow({ where: { id: planId } });
          const membershipId = `membership-${randomUUID()}`;
          const msStatus: MembershipStatus =
            end! < today ? 'expired' : start! > today ? 'draft' : 'active';
          const finalPrice = Number(plan.price);

          await tx.membership.create({
            data: {
              id: membershipId,
              memberId,
              planId,
              startDate: start!,
              endDate: end!,
              status: msStatus,
              regularPrice: new Prisma.Decimal(finalPrice),
              finalPrice: new Prisma.Decimal(finalPrice),
            },
          });

          const paid = Math.max(0, finalPrice - debt);
          if (paid > 0) {
            await tx.payment.create({
              data: {
                id: `payment-${randomUUID()}`,
                tenantId: TENANT_ID,
                branchId,
                memberId,
                membershipId,
                amount: new Prisma.Decimal(paid),
                paymentDate: start!,
                status: 'paid',
                paymentMethod: 'cash',
              },
            });
          }
        }
      });

      if (planId) {
        withMembership++;
        if (isDance) danceCount++;
      } else {
        profileOnly++;
      }
    }

    console.log(`Parsed ${data.length} row(s) from ${csvPath}.`);
    console.log(`  Existing Platinum RSA members to delete first: ${existingMembers.length}`);
    console.log(`  Skipped (no name): ${skippedNoName}`);
    console.log(`  Skipped (unrecognized sex value): ${skippedUnknownSex}`);
    console.log(`  Skipped (area name not found): ${skippedNoArea}`);
    console.log(`  To create: ${toCreate} (male: ${maleCount}, female: ${femaleCount})`);
    console.log(`  Phone nulled out (malformed): ${phoneNulled}`);
    console.log(`  With Membership+Payment: ${withMembership} (of which dance/رقص شرقي: ${danceCount})`);
    console.log(`  Profile only (no date range / bad date range): ${profileOnly}`);
    console.log(`  Bad date range (end<start or unparseable year): ${badDateRange}`);
    console.log(`  memberNumber range: ${formatOrgNumber(prefix, 1)}..${formatOrgNumber(prefix, sequence - 1)}`);

    if (dryRun) {
      console.log('\nDry run — no rows written.');
      return;
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.member.deleteMany({ where: { tenantId: TENANT_ID } });
        for (const op of ops) {
          await op(tx);
        }
      },
      { timeout: 120_000 },
    );

    console.log(`\nDone. Deleted ${existingMembers.length}, imported ${toCreate} member(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
