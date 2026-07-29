import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword } from '../../common/password';
import { isValidCurrencyCode } from '../../common/currencies';

export type CreateTenantInput = {
  tenantName: string;
  branch: {
    name: string;
    address?: string;
    phone?: string;
    countryCode?: string;
    operatingCurrencyCode?: string;
  };
  owner: {
    name: string;
    email: string;
    username: string;
    password: string;
  };
};

export type TenantSummary = {
  id: string;
  name: string;
  createdAt: Date;
  branchCount: number;
  ownerEmail: string | null;
};

@Injectable()
export class PlatformAdminTenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants(): Promise<TenantSummary[]> {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        branches: { select: { id: true } },
        users: { where: { role: 'owner' }, select: { email: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      createdAt: tenant.createdAt,
      branchCount: tenant.branches.length,
      ownerEmail: tenant.users[0]?.email ?? null,
    }));
  }

  async createTenant(input: CreateTenantInput): Promise<TenantSummary> {
    const tenantName = input.tenantName?.trim();
    const branchName = input.branch?.name?.trim();
    const ownerName = input.owner?.name?.trim();
    const ownerEmail = input.owner?.email?.trim().toLowerCase();
    const ownerUsername = input.owner?.username?.trim().toLowerCase();
    const ownerPassword = input.owner?.password ?? '';

    if (!tenantName) {
      throw new BadRequestException('Organization name is required.');
    }
    if (!branchName) {
      throw new BadRequestException('First branch name is required.');
    }
    if (!ownerName || !ownerEmail?.includes('@') || !ownerUsername) {
      throw new BadRequestException(
        'Owner name, a valid email, and a username are required.',
      );
    }
    if (ownerPassword.length < 6) {
      throw new BadRequestException(
        'Owner password must be at least 6 characters.',
      );
    }

    // Sign-in looks up users by email/username across ALL tenants with no
    // tenant-scoping (see AuthService.signIn) — two tenants sharing a
    // username would make one of them permanently unable to sign in. Not a
    // full fix (that needs tenant-scoped sign-in), but stops new collisions.
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: ownerEmail, mode: 'insensitive' } },
          { username: { equals: ownerUsername, mode: 'insensitive' } },
        ],
      },
    });
    if (existing) {
      throw new BadRequestException(
        'That owner email or username is already in use by another tenant.',
      );
    }

    const rawCurrency = (input.branch.operatingCurrencyCode ?? 'ILS')
      .trim()
      .toUpperCase();
    const operatingCurrencyCode = isValidCurrencyCode(rawCurrency)
      ? rawCurrency
      : 'ILS';

    const tenantId = `tenant-${randomUUID()}`;
    const branchId = `branch-${randomUUID()}`;
    const passwordHash = hashPassword(ownerPassword);

    await this.prisma.$transaction([
      this.prisma.tenant.create({
        data: { id: tenantId, name: tenantName },
      }),
      this.prisma.branch.create({
        data: {
          id: branchId,
          tenantId,
          name: branchName,
          address: input.branch.address?.trim() || undefined,
          phone: input.branch.phone?.trim() || undefined,
          countryCode: input.branch.countryCode?.trim().toUpperCase() || undefined,
          operatingCurrencyCode,
          status: 'active',
        },
      }),
      this.prisma.user.create({
        data: {
          id: `user-${randomUUID()}`,
          tenantId,
          email: ownerEmail,
          username: ownerUsername,
          name: ownerName,
          role: 'owner',
          passwordHash,
          branchId,
          branchName,
          employeeId: null,
        },
      }),
    ]);

    return {
      id: tenantId,
      name: tenantName,
      createdAt: new Date(),
      branchCount: 1,
      ownerEmail,
    };
  }

  async updateTenantName(tenantId: string, name: string): Promise<TenantSummary> {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new BadRequestException('Organization name is required.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branches: { select: { id: true } },
        users: { where: { role: 'owner' }, select: { email: true }, take: 1 },
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { name: trimmed },
    });

    return {
      id: updated.id,
      name: updated.name,
      createdAt: updated.createdAt,
      branchCount: tenant.branches.length,
      ownerEmail: tenant.users[0]?.email ?? null,
    };
  }
}
