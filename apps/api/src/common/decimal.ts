import { BadRequestException } from '@nestjs/common';
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

/**
 * Validates and converts a 0-100 percentage input (discount %, default
 * discount %, ...) to a Decimal. Shared so every caller applies the same
 * range/finiteness rule — see discount.md §9/§19 Rule for why this can't
 * drift between the membership discount and the discount type's default.
 */
export function parsePercent(
  value: number | undefined,
  fieldLabel: string,
): Prisma.Decimal {
  if (value === undefined) {
    return new Prisma.Decimal(0);
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new BadRequestException(`${fieldLabel} must be a finite number.`);
  }

  if (value < 0 || value > 100) {
    throw new BadRequestException(`${fieldLabel} must be between 0 and 100.`);
  }

  return new Prisma.Decimal(value);
}
