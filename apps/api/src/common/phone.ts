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

/**
 * Digits of the national (local) part of a stored phone number: strips the
 * given dial code when the number starts with it, otherwise just strips
 * non-digits — plus leading zeros either way, so `+972500000001` (dial code
 * 972) and a raw-stored `0500000001` both yield `500000001`.
 */
export function localPartDigits(
  phone: string,
  dialCode: string | undefined,
): string {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  if (dialCode && cleaned.startsWith(`+${dialCode}`)) {
    return cleaned.slice(1 + dialCode.length).replace(/^0+/, '');
  }
  return cleaned.replace(/\D/g, '').replace(/^0+/, '');
}
