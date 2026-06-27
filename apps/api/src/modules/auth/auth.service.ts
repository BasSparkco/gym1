import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SESSION_COOKIE_NAME = 'spark_gym_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

function getAuthPaths() {
  const root = process.env.API_DATA_ROOT ?? join(__dirname, '..', '..', '..');
  return {
    seedPath: join(root, 'data', 'auth-seed.json'),
    storePath: join(root, '.local', 'auth-store.json'),
    dataDir: join(root, 'data'),
    localDir: join(root, '.local'),
  };
}

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'owner' | 'manager' | 'front-desk';
  tenant: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
  };
};

type StoredUser = SessionUser & {
  passwordHash: string;
};

type SessionRecord = {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
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
  name: string;
  role: SessionUser['role'];
  password: string;
  branchId: string;
  branchName: string;
};

export type UpdateUserInput = {
  name?: string;
  role?: SessionUser['role'];
  branchId?: string;
  branchName?: string;
  password?: string;
};

type AuthStore = {
  users: StoredUser[];
  sessions: SessionRecord[];
};

type AuthSeed = {
  users: StoredUser[];
};

const defaultAuthSeed: AuthSeed = {
  users: [
    {
      id: 'user-owner-001',
      email: 'owner@sparkgym.local',
      username: 'owner',
      passwordHash:
        'scrypt:7dd174123a6767616d8bbbd028f4c5f1:04fef104953bb3c1df97d712e62e9f00ea9a5bdfc74de175d84ab87b427d941c6f367d26e445851f6a7c1172450b9a770da0470d6e06a478f52c711f10aa314f',
      name: 'Spark Gym Owner',
      role: 'owner',
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
      role: 'front-desk',
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

@Injectable()
export class AuthService implements OnModuleInit {
  private store: AuthStore = {
    users: defaultAuthSeed.users,
    sessions: [],
  };

  onModuleInit() {
    this.store = this.readStore();
    this.pruneExpiredSessions();
  }

  getSessionCookieName() {
    return SESSION_COOKIE_NAME;
  }

  getCurrentSessionFromCookieHeader(cookieHeader: string | undefined) {
    return this.getCurrentSession(
      this.readSessionCookie(cookieHeader, this.getSessionCookieName()),
    );
  }

  signIn(input: SignInInput) {
    this.pruneExpiredSessions();

    const normalizedIdentifier = input.identifier.trim().toLowerCase();
    const user = this.store.users.find((candidate) => {
      return (
        candidate.email.toLowerCase() === normalizedIdentifier ||
        candidate.username.toLowerCase() === normalizedIdentifier
      );
    });

    if (!user || !this.passwordMatches(user.passwordHash, input.password)) {
      return null;
    }

    const sessionUser = this.toSessionUser(user);
    const token = randomUUID();
    const now = Date.now();
    const sessionRecord: SessionRecord = {
      token,
      userId: sessionUser.id,
      createdAt: now,
      expiresAt: now + SESSION_DURATION_MS,
    };

    this.store.sessions.push(sessionRecord);
    this.writeStore();

    return {
      token,
      user: sessionUser,
    };
  }

  getCurrentSession(token: string | undefined): CurrentSession | null {
    if (!token) {
      return null;
    }

    this.pruneExpiredSessions();

    const session = this.store.sessions.find(
      (candidate) => candidate.token === token,
    );

    if (!session) {
      return null;
    }

    const user = this.store.users.find(
      (candidate) => candidate.id === session.userId,
    );

    if (!user) {
      this.store.sessions = this.store.sessions.filter(
        (candidate) => candidate.token !== token,
      );
      this.writeStore();
      return null;
    }

    return {
      token: session.token,
      user: this.toSessionUser(user),
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  }

  clearSession(token: string | undefined) {
    if (!token) {
      return;
    }

    const nextSessions = this.store.sessions.filter(
      (candidate) => candidate.token !== token,
    );

    if (nextSessions.length === this.store.sessions.length) {
      return;
    }

    this.store.sessions = nextSessions;
    this.writeStore();
  }

  listUsersForTenant(tenantId: string): SessionUser[] {
    return this.store.users
      .filter((user) => user.tenant.id === tenantId)
      .map((user) => this.toSessionUser(user));
  }

  getUserForTenant(tenantId: string, userId: string): SessionUser {
    const user = this.store.users.find(
      (candidate) =>
        candidate.id === userId && candidate.tenant.id === tenantId,
    );

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.toSessionUser(user);
  }

  createUser(
    tenantId: string,
    tenantName: string,
    input: CreateUserInput,
  ): SessionUser {
    const email = input.email.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      throw new BadRequestException('A valid email address is required.');
    }

    if (!input.name?.trim()) {
      throw new BadRequestException('Name is required.');
    }

    if (!input.password || input.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }

    const existingUser = this.store.users.find(
      (candidate) => candidate.email.toLowerCase() === email,
    );

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const username = email.split('@')[0];
    const newUser: StoredUser = {
      id: `user-${randomUUID()}`,
      email,
      username,
      name: input.name.trim(),
      role: input.role,
      passwordHash: this.hashPassword(input.password),
      tenant: { id: tenantId, name: tenantName },
      branch: { id: input.branchId, name: input.branchName },
    };

    this.store.users.push(newUser);
    this.writeStore();

    return this.toSessionUser(newUser);
  }

  syncBranchNameForUsers(
    tenantId: string,
    branchId: string,
    newName: string,
  ): void {
    let changed = false;
    for (const user of this.store.users) {
      if (user.tenant.id === tenantId && user.branch.id === branchId) {
        user.branch = { id: branchId, name: newName };
        changed = true;
      }
    }
    if (changed) this.writeStore();
  }

  switchBranchForUser(
    tenantId: string,
    userId: string,
    branchId: string,
    branchName: string,
  ): SessionUser {
    const idx = this.store.users.findIndex(
      (u) => u.id === userId && u.tenant.id === tenantId,
    );
    if (idx === -1) throw new NotFoundException('User not found.');
    this.store.users[idx] = {
      ...this.store.users[idx],
      branch: { id: branchId, name: branchName },
    };
    this.writeStore();
    return this.toSessionUser(this.store.users[idx]);
  }

  updateUser(
    tenantId: string,
    userId: string,
    input: UpdateUserInput,
  ): SessionUser {
    const idx = this.store.users.findIndex(
      (candidate) =>
        candidate.id === userId && candidate.tenant.id === tenantId,
    );

    if (idx === -1) {
      throw new NotFoundException('User not found.');
    }

    const current = this.store.users[idx];
    const next: StoredUser = {
      ...current,
      name: input.name?.trim() ?? current.name,
      role: input.role ?? current.role,
      branch: {
        id: input.branchId ?? current.branch.id,
        name: input.branchName ?? current.branch.name,
      },
      passwordHash: input.password
        ? this.hashPassword(input.password)
        : current.passwordHash,
    };

    this.store.users[idx] = next;
    this.writeStore();

    return this.toSessionUser(next);
  }

  private toSessionUser(user: StoredUser): SessionUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      tenant: user.tenant,
      branch: user.branch,
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${hash}`;
  }

  private passwordMatches(expectedHash: string, received: string) {
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

  private pruneExpiredSessions() {
    const now = Date.now();
    const nextSessions = this.store.sessions.filter(
      (session) => session.expiresAt > now,
    );

    if (nextSessions.length === this.store.sessions.length) {
      return;
    }

    this.store.sessions = nextSessions;
    this.writeStore();
  }

  private readStore() {
    this.ensureStoreFile();

    const { storePath } = getAuthPaths();
    const rawStore = readFileSync(storePath, 'utf8');
    const parsedStore = JSON.parse(rawStore) as AuthStore;

    return {
      users: parsedStore.users,
      sessions: parsedStore.sessions ?? [],
    };
  }

  private writeStore() {
    this.ensureStoreFile();
    const { storePath } = getAuthPaths();
    writeFileSync(storePath, JSON.stringify(this.store, null, 2) + '\n');
  }

  private ensureStoreFile() {
    const { localDir, storePath } = getAuthPaths();

    if (!existsSync(localDir)) {
      mkdirSync(localDir, { recursive: true });
    }

    this.ensureSeedFile();

    if (!existsSync(storePath)) {
      const { seedPath } = getAuthPaths();
      const rawSeed = readFileSync(seedPath, 'utf8');
      const parsedSeed = JSON.parse(rawSeed) as AuthSeed;

      writeFileSync(
        storePath,
        JSON.stringify(
          {
            users: parsedSeed.users,
            sessions: [],
          },
          null,
          2,
        ) + '\n',
      );
    }
  }

  private ensureSeedFile() {
    const { dataDir, seedPath } = getAuthPaths();

    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    if (!existsSync(seedPath)) {
      writeFileSync(
        seedPath,
        JSON.stringify(defaultAuthSeed, null, 2) + '\n',
      );
    }
  }

  private readSessionCookie(cookieHeader: string | undefined, name: string) {
    if (!cookieHeader) {
      return undefined;
    }

    const segments = cookieHeader.split(';');

    for (const segment of segments) {
      const [cookieName, ...cookieValueParts] = segment.trim().split('=');

      if (cookieName === name) {
        return decodeURIComponent(cookieValueParts.join('='));
      }
    }

    return undefined;
  }
}
