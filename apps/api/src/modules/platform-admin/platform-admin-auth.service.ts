import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { passwordMatches } from '../../common/password';
import { readSessionCookie } from '../../common/cookies';

// Deliberately separate from the tenant-staff session (auth.service.ts) —
// distinct cookie name and Redis key prefix so a platform-admin session can
// never be confused with, or accidentally accepted as, a gym-staff session.
const SESSION_COOKIE_NAME = 'spark_platform_admin_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

export type PlatformAdminSessionUser = {
  id: string;
  email: string;
  name: string;
};

type CurrentSession = {
  token: string;
  user: PlatformAdminSessionUser;
};

type StoredSession = {
  adminId: string;
};

@Injectable()
export class PlatformAdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  getSessionCookieName() {
    return SESSION_COOKIE_NAME;
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ token: string; user: PlatformAdminSessionUser } | null> {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin || !passwordMatches(admin.passwordHash, password)) {
      return null;
    }

    const token = randomUUID();
    const stored: StoredSession = { adminId: admin.id };
    await this.redis.set(
      this.sessionKey(token),
      JSON.stringify(stored),
      'EX',
      Math.floor(SESSION_DURATION_MS / 1000),
    );

    return { token, user: this.toSessionUser(admin) };
  }

  async getCurrentSessionFromCookieHeader(
    cookieHeader: string | undefined,
  ): Promise<CurrentSession | null> {
    return this.getCurrentSession(
      readSessionCookie(cookieHeader, this.getSessionCookieName()),
    );
  }

  async getCurrentSession(
    token: string | undefined,
  ): Promise<CurrentSession | null> {
    if (!token) {
      return null;
    }

    const raw = await this.redis.get(this.sessionKey(token));
    if (!raw) {
      return null;
    }

    const stored = JSON.parse(raw) as StoredSession;
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id: stored.adminId },
    });

    if (!admin) {
      await this.redis.del(this.sessionKey(token));
      return null;
    }

    return { token, user: this.toSessionUser(admin) };
  }

  async clearSession(token: string | undefined) {
    if (!token) {
      return;
    }

    await this.redis.del(this.sessionKey(token));
  }

  private sessionKey(token: string): string {
    return `platform-admin-session:${token}`;
  }

  private toSessionUser(admin: {
    id: string;
    email: string;
    name: string;
  }): PlatformAdminSessionUser {
    return { id: admin.id, email: admin.email, name: admin.name };
  }
}
