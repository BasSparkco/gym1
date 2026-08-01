import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { UserRole as DbUserRole } from '../../generated/prisma/enums';
import { hashPassword, passwordMatches } from '../../common/password';
import { readSessionCookie } from '../../common/cookies';

const SESSION_COOKIE_NAME = 'spark_gym_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'owner' | 'manager' | 'front-desk';
  // Employee record this account belongs to, if any — used e.g. to default a
  // new member's "registered by" to the person doing the registration.
  employeeId: string | null;
  tenant: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
  };
};

type CurrentSession = {
  token: string;
  user: SessionUser;
  createdAt: number;
  expiresAt: number;
};

type SignInInput = {
  identifier: string;
  password: string;
};

export type CreateUserInput = {
  email: string;
  username: string;
  role: SessionUser['role'];
  password: string;
  branchId: string;
  branchName: string;
  // Every account must be linked to an employee record (enforced below) —
  // an account is always someone's staff identity, not a standalone login.
  // The account's display name is taken from that employee's fullName, not
  // entered separately here.
  employeeId: string;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  role?: SessionUser['role'];
  branchId?: string;
  branchName?: string;
  password?: string;
  // string = link to that employee, null = unlink, undefined = no change
  employeeId?: string | null;
};

// Prisma enum values can't contain hyphens, so 'front-desk' is stored as
// 'frontDesk' — mapped at this service's boundary so nothing else in the app
// (controllers, the frontend contract) needs to know about it.
const ROLE_TO_DB: Record<SessionUser['role'], DbUserRole> = {
  owner: 'owner',
  manager: 'manager',
  'front-desk': 'frontDesk',
};

const ROLE_FROM_DB: Record<DbUserRole, SessionUser['role']> = {
  owner: 'owner',
  manager: 'manager',
  frontDesk: 'front-desk',
};

export const defaultAuthSeed = {
  users: [
    {
      id: 'user-owner-001',
      email: 'owner@sparkgym.local',
      username: 'owner',
      passwordHash:
        'scrypt:7dd174123a6767616d8bbbd028f4c5f1:04fef104953bb3c1df97d712e62e9f00ea9a5bdfc74de175d84ab87b427d941c6f367d26e445851f6a7c1172450b9a770da0470d6e06a478f52c711f10aa314f',
      name: 'Spark Gym Owner',
      role: 'owner' as const,
      tenant: {
        id: 'tenant-spark-gym',
        name: 'Spark Gym',
      },
      branch: {
        id: 'Platinum Fitness',
        name: 'Ramallah Main Branch',
      },
    },
    {
      id: 'user-frontdesk-001',
      email: 'frontdesk@sparkgym.local',
      username: 'frontdesk',
      passwordHash:
        'scrypt:006e979410fbccb0600f59871608d011:192ceb1ce366f13d6a46c0ae49243f53e53bbf49b0d60eb6fef528967d7c23fc0b6d2fe0c8d4a07781c5e59751136d09f95c57272b8426ee7131e9b914422543',
      name: 'Front Desk User',
      role: 'front-desk' as const,
      tenant: {
        id: 'tenant-spark-gym',
        name: 'Spark Gym',
      },
      branch: {
        id: 'Platinum Fitness',
        name: 'Ramallah Main Branch',
      },
    },
  ],
};

type StoredSession = {
  userId: string;
  createdAt: number;
  expiresAt: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  getSessionCookieName() {
    return SESSION_COOKIE_NAME;
  }

  async getCurrentSessionFromCookieHeader(
    cookieHeader: string | undefined,
  ): Promise<CurrentSession | null> {
    return this.getCurrentSession(
      readSessionCookie(cookieHeader, this.getSessionCookieName()),
    );
  }

  async signIn(input: SignInInput) {
    const normalizedIdentifier = input.identifier.trim().toLowerCase();

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: { equals: normalizedIdentifier, mode: 'insensitive' } },
          { username: { equals: normalizedIdentifier, mode: 'insensitive' } },
        ],
      },
      include: { tenant: true },
    });

    // The identifier may match users in more than one tenant — the password
    // decides which account is actually being signed into.
    const user = users.find((candidate) =>
      passwordMatches(candidate.passwordHash, input.password),
    );

    if (!user) {
      return null;
    }

    if (user.tenant.status === 'paused') {
      throw new ForbiddenException({
        code: 'TENANT_PAUSED',
        message: 'This organization has been paused.',
        reason: user.tenant.pausedReason,
      });
    }

    const sessionUser = this.toSessionUser(user);
    const token = randomUUID();
    const now = Date.now();
    const expiresAt = now + SESSION_DURATION_MS;

    const stored: StoredSession = { userId: user.id, createdAt: now, expiresAt };
    await this.redis.set(
      this.sessionKey(token),
      JSON.stringify(stored),
      'EX',
      Math.floor(SESSION_DURATION_MS / 1000),
    );

    return {
      token,
      user: sessionUser,
    };
  }

  async getCurrentSession(
    token: string | undefined,
  ): Promise<CurrentSession | null> {
    if (!token) {
      return null;
    }

    // Redis's own TTL already means an expired session simply isn't there
    // anymore — no manual expiresAt filtering needed.
    const raw = await this.redis.get(this.sessionKey(token));
    if (!raw) {
      return null;
    }

    const stored = JSON.parse(raw) as StoredSession;

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: { tenant: true },
    });

    if (!user) {
      // User was deleted after the session was issued — treat as invalid.
      await this.redis.del(this.sessionKey(token));
      return null;
    }

    return {
      token,
      user: this.toSessionUser(user),
      createdAt: stored.createdAt,
      expiresAt: stored.expiresAt,
    };
  }

  async clearSession(token: string | undefined) {
    if (!token) {
      return;
    }

    await this.redis.del(this.sessionKey(token));
  }

  private sessionKey(token: string): string {
    return `session:${token}`;
  }

  async listUsersForTenant(
    tenantId: string,
    branchId?: string,
  ): Promise<SessionUser[]> {
    const users = await this.prisma.user.findMany({
      where: { tenantId, ...(branchId ? { branchId } : {}) },
      include: { tenant: true },
    });
    return users.map((user) => this.toSessionUser(user));
  }

  async getUserForTenant(
    tenantId: string,
    userId: string,
  ): Promise<SessionUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.toSessionUser(user);
  }

  async createUser(
    tenantId: string,
    tenantName: string,
    input: CreateUserInput,
  ): Promise<SessionUser> {
    const email = input.email.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      throw new BadRequestException('A valid email address is required.');
    }

    const username = input.username?.trim().toLowerCase() ?? '';
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      throw new BadRequestException(
        'Username must be 3-32 characters and may only contain lowercase letters, numbers, dots, hyphens, and underscores.',
      );
    }

    if (!input.password || input.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }

    if (!input.employeeId) {
      throw new BadRequestException(
        'A user account must be linked to an employee.',
      );
    }
    const employee = await this.assertEmployeeLinkable(
      tenantId,
      input.employeeId,
    );

    // Email and username must be unique across ALL tenants: sign-in matches
    // the identifier globally, so a cross-tenant collision would make one of
    // the accounts unreachable.
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: 'insensitive' } },
          { username: { equals: username, mode: 'insensitive' } },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'A user with this email or username already exists.',
      );
    }

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: `user-${randomUUID()}`,
          tenantId,
          email,
          username,
          name: employee.fullName,
          role: ROLE_TO_DB[input.role],
          passwordHash: hashPassword(input.password),
          branchId: input.branchId,
          branchName: input.branchName,
          employeeId: input.employeeId,
        },
        include: { tenant: true },
      });

      await tx.employee.update({
        where: { id: input.employeeId },
        data: { isUser: true },
      });

      return user;
    });

    return this.toSessionUser(newUser);
  }

  // An employee can be linked to at most one account (also enforced by the
  // unique index on User.employeeId) and must belong to the caller's tenant.
  private async assertEmployeeLinkable(tenantId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      include: { user: { select: { id: true } } },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found.');
    }
    if (employee.user) {
      throw new BadRequestException(
        'This employee is already linked to a user account.',
      );
    }
    return employee;
  }

  async syncBranchNameForUsers(
    tenantId: string,
    branchId: string,
    newName: string,
  ): Promise<void> {
    await this.prisma.user.updateMany({
      where: { tenantId, branchId },
      data: { branchName: newName },
    });
  }

  async switchBranchForUser(
    tenantId: string,
    userId: string,
    branchId: string,
    branchName: string,
  ): Promise<SessionUser> {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!existing) throw new NotFoundException('User not found.');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { branchId, branchName },
      include: { tenant: true },
    });

    return this.toSessionUser(updated);
  }

  async updateUser(
    tenantId: string,
    userId: string,
    input: UpdateUserInput,
  ): Promise<SessionUser> {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('User not found.');
    }

    if (input.employeeId === null) {
      throw new BadRequestException(
        'A user account must stay linked to an employee.',
      );
    }

    const employeeIdChanged =
      input.employeeId !== undefined && input.employeeId !== existing.employeeId;

    if (employeeIdChanged && input.employeeId) {
      await this.assertEmployeeLinkable(tenantId, input.employeeId);
    }

    let normalizedEmail: string | undefined;
    if (input.email !== undefined) {
      normalizedEmail = input.email.trim().toLowerCase();

      if (!normalizedEmail || !normalizedEmail.includes('@')) {
        throw new BadRequestException('A valid email address is required.');
      }

      if (normalizedEmail !== existing.email) {
        // Same cross-tenant uniqueness rule as createUser (see comment there):
        // sign-in matches the identifier globally, so this must stay unique
        // across all tenants, not just this one.
        const existingUser = await this.prisma.user.findFirst({
          where: {
            id: { not: userId },
            email: { equals: normalizedEmail, mode: 'insensitive' },
          },
        });

        if (existingUser) {
          throw new BadRequestException(
            'A user with this email already exists.',
          );
        }
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          ...(input.name !== undefined && { name: input.name.trim() }),
          ...(normalizedEmail !== undefined && { email: normalizedEmail }),
          ...(input.role !== undefined && { role: ROLE_TO_DB[input.role] }),
          ...(input.branchId !== undefined && { branchId: input.branchId }),
          ...(input.branchName !== undefined && {
            branchName: input.branchName,
          }),
          ...(input.password !== undefined && {
            passwordHash: hashPassword(input.password),
          }),
          ...(employeeIdChanged && { employeeId: input.employeeId }),
        },
        include: { tenant: true },
      });

      if (employeeIdChanged) {
        if (existing.employeeId) {
          await tx.employee.update({
            where: { id: existing.employeeId },
            data: { isUser: false },
          });
        }
        if (input.employeeId) {
          await tx.employee.update({
            where: { id: input.employeeId },
            data: { isUser: true },
          });
        }
      }

      return user;
    });

    return this.toSessionUser(updated);
  }

  private toSessionUser(user: {
    id: string;
    email: string;
    username: string;
    name: string;
    role: DbUserRole;
    tenantId: string;
    tenant: { name: string };
    branchId: string;
    branchName: string;
    employeeId: string | null;
  }): SessionUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: ROLE_FROM_DB[user.role],
      employeeId: user.employeeId,
      tenant: { id: user.tenantId, name: user.tenant.name },
      branch: { id: user.branchId, name: user.branchName },
    };
  }

}
