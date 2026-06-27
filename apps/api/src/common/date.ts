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
