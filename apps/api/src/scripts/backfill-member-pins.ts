/**
 * One-off backfill: assigns an app sign-in PIN to every Platinum RSA
 * member imported by reimport-platinum-rsa-members.ts, which (like the
 * rest of that bulk import) wrote Member rows directly and skipped the
 * PIN issuance MembersService.createMember normally does automatically —
 * see issueAndSendPin (members.service.ts:578).
 *
 * PIN generation logic is copied verbatim from
 * MembersService.generateUniquePin/isPinAvailableForPhone (private
 * methods, can't be imported): a random 6-digit PIN that isn't already
 * used by another member sharing this phone number (the app disambiguates
 * sign-in by phone+PIN, so uniqueness only matters within a shared phone).
 * Members with no phone on file get a PIN too (skips the collision check
 * — nothing to collide with) even though they can't use it to sign in
 * until a phone is added, since the ask was PINs for all imported
 * members, not just the ones who can use one today.
 *
 * PF-0190 already has a real PIN (staff created and sent it manually
 * after she asked) — excluded explicitly, though the pinHash:null filter
 * already excludes her on its own.
 *
 * Only sets pinHash/pinEncrypted — does NOT send anything. Sending is a
 * separate step (send-member-pin.ts) for a chosen subset of members.
 *
 * Idempotent: only touches members with pinHash still null, so reruns are
 * safe (just no-ops for anyone already processed).
 *
 * Run (build-then-run pattern, see backfill-member-debt.ts):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/backfill-member-pins.js [--dry-run]
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { hashPin, pinMatches } from '../common/pin-hash';
import { encryptPin } from '../common/pin-crypto';
import { localPartDigits } from '../common/phone';
import { findCountryByCode } from '../data/countries';

const TENANT_ID = 'tenant-ce5491e6-18a0-4397-a6f2-208e1dd06ec4'; // Platinum RSA
const EXCLUDE_MEMBER_NUMBER = 'PF-0190';

async function isPinAvailableForPhone(
  prisma: PrismaClient,
  phone: string,
  dialCode: string | undefined,
  excludeMemberId: string,
  pin: string,
): Promise<boolean> {
  const localDigits = localPartDigits(phone, dialCode);
  const samePhoneMembers = await prisma.member.findMany({
    where: {
      OR: [
        { phone },
        ...(localDigits ? [{ phone: { endsWith: localDigits } }] : []),
      ],
      pinHash: { not: null },
      id: { not: excludeMemberId },
    },
    select: { pinHash: true },
  });
  return !samePhoneMembers.some(
    (other) => other.pinHash && pinMatches(other.pinHash, pin),
  );
}

async function generateUniquePin(
  prisma: PrismaClient,
  phone: string | null,
  dialCode: string | undefined,
  excludeMemberId: string,
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    if (!phone) return pin; // nothing to collide with
    if (
      await isPinAvailableForPhone(
        prisma,
        phone,
        dialCode,
        excludeMemberId,
        pin,
      )
    ) {
      return pin;
    }
  }
  throw new Error(
    `Could not generate a unique PIN for member ${excludeMemberId}`,
  );
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const branches = await prisma.branch.findMany({
      where: { tenantId: TENANT_ID },
      select: { id: true, countryCode: true },
    });
    const dialCodeByBranch = new Map(
      branches.map((b) => [
        b.id,
        b.countryCode ? findCountryByCode(b.countryCode)?.dialCode : undefined,
      ]),
    );

    const members = await prisma.member.findMany({
      where: {
        tenantId: TENANT_ID,
        pinHash: null,
        memberNumber: { not: EXCLUDE_MEMBER_NUMBER },
      },
      select: { id: true, phone: true, homeBranchId: true, memberNumber: true },
    });

    const withPhone = members.filter((m) => m.phone).length;
    console.log(
      `Members needing a PIN: ${members.length} (${withPhone} with a phone, ${members.length - withPhone} without).`,
    );

    if (dryRun) {
      console.log('Dry run — no PINs written.');
      return;
    }

    let done = 0;
    for (const member of members) {
      const dialCode = dialCodeByBranch.get(member.homeBranchId);
      const pin = await generateUniquePin(
        prisma,
        member.phone,
        dialCode,
        member.id,
      );
      await prisma.member.update({
        where: { id: member.id },
        data: { pinHash: hashPin(pin), pinEncrypted: encryptPin(pin) },
      });
      done++;
      if (done % 100 === 0) console.log(`  ${done}/${members.length}...`);
    }

    console.log(`Done. Assigned a PIN to ${done} member(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
