import { createHmac } from 'node:crypto';

/**
 * Converts a member record ID to the UUID that is stored as identifier_number
 * on the BAS-IP device.
 *
 * New members have IDs like "member-<uuid>" — we strip the prefix.
 * Seeded members have IDs like "member-001" — we produce a stable UUID-like
 * string from the numeric suffix so the device accepts it.
 *
 * The same UUID is used as both the QR code content and the device link_id.
 * When the device scans the QR at the gate and sends a callback with
 * identifier_type "qr", identifier_number will equal this UUID value.
 */
export function memberIdToUuid(memberId: string): string {
  const stripped = memberId.startsWith('member-') ? memberId.slice(7) : memberId;
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      stripped,
    )
  ) {
    return stripped;
  }
  // Fallback for non-UUID member IDs (seed data like "member-001")
  const hex = stripped.replace(/[^0-9a-f]/gi, '').padStart(12, '0').slice(0, 12);
  return `00000000-0000-0000-0000-${hex}`;
}

/**
 * Returns a 32-char hex HMAC-SHA256 signature for the given memberId.
 * Used to generate and verify token-authenticated public QR download URLs.
 * Secret is taken from QR_SECRET env var, falling back to DEVICE_TOKEN.
 */
export function generateQrSig(memberId: string): string {
  const secret =
    process.env.QR_SECRET ?? process.env.DEVICE_TOKEN ?? 'dev-qr-secret';
  return createHmac('sha256', secret).update(memberId).digest('hex').slice(0, 32);
}

/**
 * Builds the publicly-accessible QR code download URL for a member.
 * The URL includes an HMAC signature so it is valid without a session cookie.
 */
export function makeQrPublicUrl(memberId: string): string {
  const domain = process.env.PUBLIC_DOMAIN ?? 'gym.sparkco.vip';
  const sig = generateQrSig(memberId);
  return `https://${domain}/api/members/${encodeURIComponent(memberId)}/qrcode/public?sig=${sig}`;
}
