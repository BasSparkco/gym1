import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// Reversible counterpart to pin-hash.ts's one-way hash — lets staff look up
// a member's current app-sign-in PIN in the PIN popup without resetting it.
// AES-256-GCM keyed by PIN_ENCRYPTION_KEY (see .env.example). Anyone with
// this key and DB access can recover every stored PIN, so sign-in
// verification always goes through the hash in pin-hash.ts, never this.
function getKey(): Buffer {
  const hex = process.env.PIN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'PIN_ENCRYPTION_KEY must be set to a 64-character hex string (generate with: openssl rand -hex 32).',
    );
  }
  return Buffer.from(hex, 'hex');
}

export function encryptPin(pin: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(pin, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `aesgcm:${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

// Returns null for anything that can't be decrypted (wrong/rotated key,
// corrupted value) rather than throwing, so a lookup failure just shows
// "no PIN on file" instead of a 500.
export function decryptPin(stored: string): string | null {
  const [algorithm, ivHex, authTagHex, ciphertextHex] = stored.split(':');
  if (algorithm !== 'aesgcm' || !ivHex || !authTagHex || !ciphertextHex) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      getKey(),
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex, 'hex')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  } catch {
    return null;
  }
}
