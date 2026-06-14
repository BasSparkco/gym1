#!/usr/bin/env node
/**
 * One-time migration: normalize member phone numbers to E.164 format.
 *
 * For each member in the live .local/operations-store.json, this script:
 *   1. Looks up the member's home branch and its countryCode.
 *   2. Resolves the E.164 dial code from the COUNTRIES table.
 *   3. Applies the same normalizePhone() logic used by MembersService.
 *   4. Updates phone and emergencyContactPhone in-place.
 *
 * Flags:
 *   --dry-run   Print what would change without writing the store (default).
 *   --apply     Write the normalized store back to disk.
 *
 * Usage:
 *   node scripts/normalize-phones.js           # dry run
 *   node scripts/normalize-phones.js --apply   # apply changes
 */

'use strict';

const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

// ── Countries dial code table (mirrors src/data/countries.ts) ────────────────
const COUNTRIES = [
  { code: 'AF', dialCode: '93' }, { code: 'AL', dialCode: '355' },
  { code: 'DZ', dialCode: '213' }, { code: 'AR', dialCode: '54' },
  { code: 'AU', dialCode: '61' }, { code: 'AT', dialCode: '43' },
  { code: 'AZ', dialCode: '994' }, { code: 'BH', dialCode: '973' },
  { code: 'BD', dialCode: '880' }, { code: 'BE', dialCode: '32' },
  { code: 'BR', dialCode: '55' }, { code: 'CA', dialCode: '1' },
  { code: 'CL', dialCode: '56' }, { code: 'CN', dialCode: '86' },
  { code: 'CO', dialCode: '57' }, { code: 'HR', dialCode: '385' },
  { code: 'CY', dialCode: '357' }, { code: 'CZ', dialCode: '420' },
  { code: 'DK', dialCode: '45' }, { code: 'EG', dialCode: '20' },
  { code: 'FI', dialCode: '358' }, { code: 'FR', dialCode: '33' },
  { code: 'DE', dialCode: '49' }, { code: 'GH', dialCode: '233' },
  { code: 'GR', dialCode: '30' }, { code: 'HU', dialCode: '36' },
  { code: 'IN', dialCode: '91' }, { code: 'ID', dialCode: '62' },
  { code: 'IE', dialCode: '353' }, { code: 'IL', dialCode: '972' },
  { code: 'IT', dialCode: '39' }, { code: 'JO', dialCode: '962' },
  { code: 'JP', dialCode: '81' }, { code: 'KW', dialCode: '965' },
  { code: 'LB', dialCode: '961' }, { code: 'MY', dialCode: '60' },
  { code: 'MX', dialCode: '52' }, { code: 'MA', dialCode: '212' },
  { code: 'NL', dialCode: '31' }, { code: 'NZ', dialCode: '64' },
  { code: 'NG', dialCode: '234' }, { code: 'NO', dialCode: '47' },
  { code: 'OM', dialCode: '968' }, { code: 'PK', dialCode: '92' },
  { code: 'PS', dialCode: '970' }, { code: 'PH', dialCode: '63' },
  { code: 'PL', dialCode: '48' }, { code: 'PT', dialCode: '351' },
  { code: 'QA', dialCode: '974' }, { code: 'RO', dialCode: '40' },
  { code: 'RU', dialCode: '7' }, { code: 'SA', dialCode: '966' },
  { code: 'SN', dialCode: '221' }, { code: 'RS', dialCode: '381' },
  { code: 'SG', dialCode: '65' }, { code: 'ZA', dialCode: '27' },
  { code: 'KR', dialCode: '82' }, { code: 'ES', dialCode: '34' },
  { code: 'SE', dialCode: '46' }, { code: 'CH', dialCode: '41' },
  { code: 'TW', dialCode: '886' }, { code: 'TZ', dialCode: '255' },
  { code: 'TH', dialCode: '66' }, { code: 'TN', dialCode: '216' },
  { code: 'TR', dialCode: '90' }, { code: 'UG', dialCode: '256' },
  { code: 'UA', dialCode: '380' }, { code: 'AE', dialCode: '971' },
  { code: 'GB', dialCode: '44' }, { code: 'US', dialCode: '1' },
  { code: 'VN', dialCode: '84' }, { code: 'YE', dialCode: '967' },
];

const dialCodeByCountry = new Map(COUNTRIES.map((c) => [c.code, c.dialCode]));

// ── normalizePhone (mirrors src/common/phone.ts) ──────────────────────────────
function normalizePhone(raw, dialCode) {
  if (!raw) return undefined;

  const cleaned = raw.replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('+')) {
    return '+' + cleaned.slice(1).replace(/\D/g, '');
  }

  if (!dialCode) {
    return raw.trim() || undefined;
  }

  const local = cleaned.replace(/\D/g, '').replace(/^0+/, '');
  if (!local) return undefined;

  return `+${dialCode}${local}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const apiRoot = join(__dirname, '..');
const storePath = join(apiRoot, '.local', 'operations-store.json');

if (!existsSync(storePath)) {
  console.error(`Store not found: ${storePath}`);
  console.error('Start the API at least once so the .local store is seeded.');
  process.exit(1);
}

const applyChanges = process.argv.includes('--apply');

const store = JSON.parse(readFileSync(storePath, 'utf8'));

// Index branches by id for O(1) lookup
const branchById = new Map((store.branches ?? []).map((b) => [b.id, b]));

let changed = 0;
let skipped = 0;

for (const member of store.members ?? []) {
  const branch = branchById.get(member.homeBranchId);
  const dialCode = branch?.countryCode
    ? dialCodeByCountry.get(branch.countryCode)
    : undefined;

  if (!dialCode) {
    // Branch has no countryCode — nothing to normalize, skip
    if (member.phone || member.emergencyContactPhone) {
      console.log(
        `[SKIP] ${member.fullName} (${member.memberNumber}) — branch "${branch?.name ?? member.homeBranchId}" has no countryCode`,
      );
      skipped++;
    }
    continue;
  }

  const newPhone = normalizePhone(member.phone, dialCode);
  const newEmergency = normalizePhone(member.emergencyContactPhone, dialCode);

  const phoneChanged = newPhone !== member.phone;
  const emergencyChanged = newEmergency !== member.emergencyContactPhone;

  if (!phoneChanged && !emergencyChanged) continue;

  changed++;
  if (phoneChanged) {
    console.log(
      `[UPDATE] ${member.fullName} (${member.memberNumber}) phone: "${member.phone}" → "${newPhone}"`,
    );
  }
  if (emergencyChanged) {
    console.log(
      `[UPDATE] ${member.fullName} (${member.memberNumber}) emergencyContactPhone: "${member.emergencyContactPhone}" → "${newEmergency}"`,
    );
  }

  if (applyChanges) {
    member.phone = newPhone;
    member.emergencyContactPhone = newEmergency;
  }
}

console.log(`\nSummary: ${changed} member(s) updated, ${skipped} skipped (no country on branch).`);

if (changed > 0 && !applyChanges) {
  console.log('\nRun with --apply to write these changes to disk.');
} else if (changed > 0 && applyChanges) {
  writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`Written: ${storePath}`);
} else {
  console.log('Nothing to update.');
}
