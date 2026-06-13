import { ForbiddenException } from '@nestjs/common';
import type { SessionUser } from '../modules/auth/auth.service';

export function requireRole(
  user: SessionUser,
  allowed: Array<SessionUser['role']>,
): void {
  if (!allowed.includes(user.role)) {
    throw new ForbiddenException('Insufficient permissions.');
  }
}
