/** Supported currency codes (ISO 4217). Mirrors apps/web/src/lib/currencies.ts.
 * A plain whitelist, not a DB table — see CURRENCIES_PLAN.md for why. */
export const CURRENCY_CODES = [
  'USD',
  'EUR',
  'ILS',
  'JOD',
  'SAR',
  'AED',
  'EGP',
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

const VALID_CURRENCY_CODES = new Set<string>(CURRENCY_CODES);

export function isValidCurrencyCode(code: string): code is CurrencyCode {
  return VALID_CURRENCY_CODES.has(code);
}
