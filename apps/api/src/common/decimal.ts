import { Prisma } from '../generated/prisma/client';

/**
 * Converts a Prisma `Decimal` field (e.g. Employee.salary, MembershipPlan.price,
 * Membership.finalPrice, Payment.amount) back to a plain JS number.
 *
 * Prisma's Decimal class serializes to a STRING via JSON.stringify (its
 * `toJSON()` returns `toString()`), not a number — the API contract (and the
 * web app, which calls `.toLocaleString()` directly on these fields) expects
 * a number, same as the old JSON store.
 */
export function toNumber(value: Prisma.Decimal): number;
export function toNumber(value: Prisma.Decimal | null): number | null;
export function toNumber(
  value: Prisma.Decimal | null | undefined,
): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  return Number(value);
}
