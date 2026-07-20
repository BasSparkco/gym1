import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Same scrypt format as AuthService.hashPassword, kept as its own tiny
// module because both MembersService (creates the hash) and
// MemberAuthService (verifies it) need to agree on it.
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pin, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function pinMatches(expectedHash: string, received: string): boolean {
  const [algorithm, salt, storedHash] = expectedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !storedHash) {
    return false;
  }

  const expectedBuffer = Buffer.from(storedHash, 'hex');
  const receivedBuffer = scryptSync(received, salt, expectedBuffer.length);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
