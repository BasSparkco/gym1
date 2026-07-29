import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function passwordMatches(
  expectedHash: string,
  received: string,
): boolean {
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
