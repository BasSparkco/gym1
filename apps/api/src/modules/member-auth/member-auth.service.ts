import { ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { pinMatches } from '../../common/pin-hash';
import { normalizePhone } from '../../common/phone';
import { findCountryByCode } from '../../data/countries';
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
   *
   * Phone is the ONLY accepted identifier, in either of two forms:
   * - international (`+972500000001`) — exact E.164 match;
   * - local (`0500000001`) — the country code is implied by the member's own
   *   branch country, since that's how people actually type their number.
   *   A member whose stored phone has a DIFFERENT country code than their
   *   branch must use the international form.
   *
   * Member numbers are not accepted: they repeat across tenants (every gym
   * has an MBR-0001), so a number + 4-digit PIN could silently sign into
   * another gym's member. The same phone may still appear in several tenants
   * (one person, two gyms) — the PIN is checked against every candidate, and
   * setMemberAppPin refuses to create a phone+PIN combination that would be
   * ambiguous here.
   */
  async signIn(
    identifier: string,
    pin: string,
  ): Promise<{ token: string; member: MemberSession } | null> {
    const trimmed = identifier.trim();
    if (!trimmed || !pin) {
      return null;
    }

    let candidates: Member[];

    if (trimmed.startsWith('+')) {
      const normalized = normalizePhone(trimmed, undefined);
      if (!normalized) {
        return null;
      }
      candidates = await this.prisma.member.findMany({
        where: {
          pinHash: { not: null },
          phone: normalized,
        },
      });
    } else {
      const local = trimmed.replace(/\D/g, '').replace(/^0+/, '');
      if (!local) {
        return null;
      }
      // Pull every member whose stored phone could complete the typed local
      // number, then keep only those whose own branch dial code actually
      // completes it (or whose phone was stored raw, exactly as typed, for
      // branches without a country configured).
      const suffixMatches = await this.prisma.member.findMany({
        where: {
          pinHash: { not: null },
          OR: [{ phone: { endsWith: local } }, { phone: trimmed }],
        },
        include: { homeBranch: { select: { countryCode: true } } },
      });
      candidates = suffixMatches.filter((candidate) => {
        if (candidate.phone === trimmed) {
          return true;
        }
        const dialCode = candidate.homeBranch.countryCode
          ? findCountryByCode(candidate.homeBranch.countryCode)?.dialCode
          : undefined;
        return dialCode
          ? candidate.phone === `+${dialCode}${local}`
          : false;
      });
    }

    const member = candidates.find(
      (candidate) => candidate.pinHash && pinMatches(candidate.pinHash, pin),
    );
    if (!member) {
      return null;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: member.tenantId },
      select: { status: true, pausedReason: true },
    });
    if (tenant?.status === 'paused') {
      throw new ForbiddenException({
        code: 'TENANT_PAUSED',
        message: 'This organization has been paused.',
        reason: tenant.pausedReason,
      });
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
