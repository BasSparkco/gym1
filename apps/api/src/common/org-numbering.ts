import { PrismaClient } from '../generated/prisma/client';

const SEQUENCE_DIGITS = 4;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// In-memory regex-filtered scan (not a SQL MAX) — avoids relying on
// lexicographic string MAX collation behavior for what's semantically a
// numeric sequence. Exported so callers that already hold the existing
// numbers (e.g. bulk importers doing other things with the same rows) can
// compute the starting sequence without a second query.
export function nextSequenceFromNumbers(existingNumbers: string[], prefix: string): number {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}-(\\d{${SEQUENCE_DIGITS}})$`);
  const used = existingNumbers
    .map((value) => value.match(pattern))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => Number(match[1]));
  return Math.max(0, ...used) + 1;
}

export function memberNumberPrefix(orgCode: string | null): string {
  return orgCode ?? 'MEM';
}

export function employeeNumberPrefix(orgCode: string | null): string {
  return orgCode ? `${orgCode}-E` : 'EMP';
}

export function formatOrgNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(SEQUENCE_DIGITS, '0')}`;
}

// Bulk importers should call this once and increment the result locally
// rather than calling `nextMemberNumber` per row, which would re-scan every
// existing member on every iteration.
export async function nextMemberSequence(
  prisma: Pick<PrismaClient, 'member'>,
  tenantId: string,
  prefix: string,
): Promise<number> {
  const members = await prisma.member.findMany({
    where: { tenantId },
    select: { memberNumber: true },
  });
  return nextSequenceFromNumbers(members.map((m) => m.memberNumber), prefix);
}

export async function nextEmployeeSequence(
  prisma: Pick<PrismaClient, 'employee'>,
  tenantId: string,
  prefix: string,
): Promise<number> {
  const employees = await prisma.employee.findMany({
    where: { tenantId },
    select: { employeeNumber: true },
  });
  return nextSequenceFromNumbers(employees.map((e) => e.employeeNumber), prefix);
}

export async function nextMemberNumber(
  prisma: Pick<PrismaClient, 'member'>,
  tenantId: string,
  orgCode: string | null,
): Promise<string> {
  const prefix = memberNumberPrefix(orgCode);
  const sequence = await nextMemberSequence(prisma, tenantId, prefix);
  return formatOrgNumber(prefix, sequence);
}

export async function nextEmployeeNumber(
  prisma: Pick<PrismaClient, 'employee'>,
  tenantId: string,
  orgCode: string | null,
): Promise<string> {
  const prefix = employeeNumberPrefix(orgCode);
  const sequence = await nextEmployeeSequence(prisma, tenantId, prefix);
  return formatOrgNumber(prefix, sequence);
}
