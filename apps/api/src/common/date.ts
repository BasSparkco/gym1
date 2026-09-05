import { BadRequestException } from '@nestjs/common';

/**
 * Returns a date as a YYYY-MM-DD string in the server's local timezone.
 * Using toISOString() would give the UTC date, which differs from local date
 * between midnight and the UTC offset (e.g. in IDT/UTC+3, from 00:00–02:59 local
 * toISOString returns the previous day).
 */
export function localDateString(date?: Date): string {
  const d = date ?? new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds `days` to a YYYY-MM-DD date string using UTC arithmetic, so the result
 * is correct regardless of the server's local timezone offset.
 *
 * Date-only strings (e.g. "2026-06-01") are parsed by the JS engine as UTC
 * midnight. Using local setDate/getDate on such a value causes an off-by-one
 * error on UTC-N servers (where UTC midnight falls on the previous local day).
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Converts a Prisma `@db.Date` column value (a JS Date at UTC midnight) back
 * to a plain "YYYY-MM-DD" string. Postgres DATE columns have no time
 * component, but the Prisma client always returns a Date object for them —
 * without this conversion at the API boundary, callers that do raw string
 * comparisons or display the value as text (both exist in the frontend, e.g.
 * comparing membership.endDate against a "YYYY-MM-DD" cutoff, or rendering
 * a member's date of birth) would see a full ISO datetime instead.
 *
 * Guards against invalid Date values (e.g. a pre-existing corrupted row) so
 * one bad record degrades to `null` instead of throwing and taking down
 * every other row in the same list response.
 */
export function toDateOnlyString(date: Date): string;
export function toDateOnlyString(date: Date | null): string | null;
export function toDateOnlyString(
  date: Date | null | undefined,
): string | null | undefined;
export function toDateOnlyString(
  date: Date | null | undefined,
): string | null | undefined {
  if (date === null) return null;
  if (date === undefined) return undefined;
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

/**
 * Parses a "YYYY-MM-DD" (or any JS-parseable) date string from a request
 * body, rejecting anything that isn't a real calendar date or falls outside
 * a sane range. Without this, a typo like "20026-08-28" (extra digit) turns
 * into a JS `Invalid Date` that Prisma writes to Postgres without error,
 * then crashes every later read of that row via `toDateOnlyString`.
 */
export function parseDateOnly(
  value: string | undefined,
  fieldName: string,
): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() < MIN_YEAR ||
    date.getFullYear() > MAX_YEAR
  ) {
    throw new BadRequestException(`${fieldName} is not a valid date.`);
  }
  return date;
}
