import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { pinMatches } from '../../common/pin-hash';
import { Member } from '../../generated/prisma/client';

// Mobile clients hold onto this a lot longer than the staff web session —
// nobody wants to re-enter a PIN every 12 hours on their phone.
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export type MemberSession = {
  id: string;
  tenantId: string;
  homeBranchId: string;
  memberNumber: string;
  fullName: string;
};

type StoredMemberSession = {
  memberId: string;
  tenantId: string;
  createdAt: number;
};

@Injectable()
export class MemberAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Same shape as staff sign-in (AuthService.signIn): looks up candidates by
   * identifier without pre-resolving a tenant, matches PIN, issues an opaque
   * bearer token backed by Redis (not a self-contained JWT, so sign-out can
   * actually revoke it — same tradeoff the staff session already makes).
   */
  async signIn(
    identifier: string,
    pin: string,
  ): Promise<{ token: string; member: MemberSession } | null> {
    const normalized = identifier.trim();
    if (!normalized || !pin) {
      return null;
    }

    const candidates = await this.prisma.member.findMany({
      where: {
        pinHash: { not: null },
        OR: [
          { memberNumber: { equals: normalized, mode: 'insensitive' } },
          { phone: normalized },
        ],
      },
    });

    const member = candidates.find(
      (candidate) => candidate.pinHash && pinMatches(candidate.pinHash, pin),
    );
    if (!member) {
      return null;
    }

    const token = randomUUID();
    const stored: StoredMemberSession = {
      memberId: member.id,
      tenantId: member.tenantId,
      createdAt: Date.now(),
    };
    await this.redis.set(
      this.sessionKey(token),
      JSON.stringify(stored),
      'EX',
      Math.floor(SESSION_DURATION_MS / 1000),
    );

    return { token, member: this.toMemberSession(member) };
  }

  async getCurrentSession(
    token: string | undefined,
  ): Promise<MemberSession | null> {
    if (!token) {
      return null;
    }

    const raw = await this.redis.get(this.sessionKey(token));
    if (!raw) {
      return null;
    }

    const stored = JSON.parse(raw) as StoredMemberSession;
    const member = await this.prisma.member.findUnique({
      where: { id: stored.memberId },
    });

    if (!member) {
      await this.redis.del(this.sessionKey(token));
      return null;
    }

    return this.toMemberSession(member);
  }

  async signOut(token: string | undefined) {
    if (!token) {
      return;
    }
    await this.redis.del(this.sessionKey(token));
  }

  private sessionKey(token: string): string {
    return `member-session:${token}`;
  }

  private toMemberSession(member: Member): MemberSession {
    return {
      id: member.id,
      tenantId: member.tenantId,
      homeBranchId: member.homeBranchId,
      memberNumber: member.memberNumber,
      fullName: member.fullName,
    };
  }
}
