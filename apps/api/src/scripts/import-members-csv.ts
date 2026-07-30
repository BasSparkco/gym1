/**
 * One-off import of members from a client-exported members.csv (columns:
 * Customer Id, Customer Name, Mobile Number, Id Number, Address, Gender,
 * Tall, Join Date, BirthDay, Number Of Subscriptions).
 *
 * "Customer Id" and "Number Of Subscriptions" are source-system-only and
 * intentionally dropped: memberNumber is auto-sequenced the normal way
 * (MEM-0001, ...) rather than reusing the old ids, and there's no
 * plan/price/date data in this file to reconstruct real Membership rows
 * from a bare subscription count.
 *
 * Not idempotent — re-running against the same CSV creates duplicates.
 *
 * Run (same build-then-run pattern as backfill-member-debt.ts):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/import-members-csv.js <path-to-csv>
 */

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Sex } from '../generated/prisma/client';
import { normalizePhone } from '../common/phone';
import { findCountryByCode } from '../data/countries';

const TENANT_ID = 'tenant-spark-gym';
const BRANCH_ID = 'Platinum Fitness';

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

function mapGender(s: string): Sex | undefined {
  const trimmed = s.trim();
  if (trimmed === 'ذكر') return 'male';
  if (trimmed === 'أنثى') return 'female';
  return undefined;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: node dist/scripts/import-members-csv.js <path-to-csv>');
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(csvPath, 'utf-8'));
  const [header, ...dataRows] = rows;
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`CSV is missing expected column "${name}"`);
    return i;
  };
  const idx = {
    name: col('Customer Name'),
    phone: col('Mobile Number'),
    idNumber: col('Id Number'),
    address: col('Address'),
    gender: col('Gender'),
    height: col('Tall'),
    joinDate: col('Join Date'),
    birthday: col('BirthDay'),
  };

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const branch = await prisma.branch.findFirstOrThrow({
      where: { id: BRANCH_ID, tenantId: TENANT_ID },
    });
    const dialCode = branch.countryCode
      ? findCountryByCode(branch.countryCode)?.dialCode
      : undefined;

    const existing = await prisma.member.findMany({
      where: { tenantId: TENANT_ID },
      select: { memberNumber: true },
    });
    const usedSequences = existing
      .map((m) => m.memberNumber.match(/^MEM-(\d{4})$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => Number(m[1]));
    let nextSequence = (Math.max(0, ...usedSequences) || 0) + 1;

    let created = 0;
    let skipped = 0;

    for (const row of dataRows) {
      const fullName = row[idx.name]?.trim();
      if (!fullName) {
        skipped++;
        continue;
      }

      const memberNumber = `MEM-${String(nextSequence).padStart(4, '0')}`;
      nextSequence++;

      await prisma.member.create({
        data: {
          id: `member-${randomUUID()}`,
          tenantId: TENANT_ID,
          homeBranchId: BRANCH_ID,
          memberNumber,
          fullName,
          phone: normalizePhone(row[idx.phone]?.trim() || undefined, dialCode),
          idNumber: row[idx.idNumber]?.trim() || undefined,
          address: row[idx.address]?.trim() || undefined,
          sex: mapGender(row[idx.gender] ?? ''),
          height: row[idx.height]?.trim() ? Number(row[idx.height]) : undefined,
          joinDate: parseUsDate(row[idx.joinDate] ?? ''),
          dateOfBirth: parseUsDate(row[idx.birthday] ?? ''),
        },
      });
      created++;
    }

    console.log(
      `Done. Imported ${created} member(s), skipped ${skipped} row(s) with no name.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
