/**
 * Converts a raw phone input into E.164 format (+<dialCode><local>).
 *
 * Rules:
 * - Numbers already starting with '+' are returned as-is (only non-digit chars
 *   after the '+' are stripped, so "+972 51-562 2300" → "+972515622300").
 * - Otherwise the dial code for the member's branch country is prepended after
 *   stripping leading zeros from the local number.
 *
 * Returns undefined when the input is falsy, so optional phone fields stay optional.
 */
export function normalizePhone(
  raw: string | undefined,
  dialCode: string | undefined,
): string | undefined {
  if (!raw) return undefined;

  const cleaned = raw.replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('+')) {
    return '+' + cleaned.slice(1).replace(/\D/g, '');
  }

  if (!dialCode) {
    // No country configured on this branch — store as-is
    return raw.trim() || undefined;
  }

  const local = cleaned.replace(/\D/g, '').replace(/^0+/, '');
  if (!local) return undefined;

  return `+${dialCode}${local}`;
}
