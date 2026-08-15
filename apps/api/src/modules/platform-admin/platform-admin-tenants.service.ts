import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword } from '../../common/password';
import { isValidCurrencyCode } from '../../common/currencies';
import { nextEmployeeNumber } from '../../common/org-numbering';

export type BranchInput = {
  name: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  operatingCurrencyCode?: string;
};

export type OwnerInput = {
  name: string;
  email: string;
  password: string;
};

export type CreateTenantInput = {
  tenantName: string;
  code: string;
  branch: BranchInput;
  owner: OwnerInput;
};

export type AddBranchInput = {
  branch: BranchInput;
  owner: OwnerInput;
};

export type UpdateBranchInput = {
  branch: BranchInput;
  owner?: { name?: string; email?: string };
};

export type TenantSummary = {
  id: string;
  name: string;
  code: string | null;
  createdAt: Date;
  branchCount: number;
  ownerEmail: string | null;
  status: 'active' | 'paused';
  pausedReason: string | null;
  pausedAt: Date | null;
};

export type BranchSummary = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  countryCode: string | null;
  operatingCurrencyCode: string;
  status: 'active' | 'inactive';
  ownerName: string | null;
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
      code: tenant.code,
      createdAt: tenant.createdAt,
      branchCount: tenant.branches.length,
      ownerEmail: tenant.users[0]?.email ?? null,
      status: tenant.status,
      pausedReason: tenant.pausedReason,
      pausedAt: tenant.pausedAt,
    }));
  }

  private validateBranchInput(branch: BranchInput) {
    const branchName = branch?.name?.trim();
    if (!branchName) {
      throw new BadRequestException('Branch name is required.');
    }

    const rawCurrency = (branch.operatingCurrencyCode ?? 'ILS').trim().toUpperCase();
    const operatingCurrencyCode = isValidCurrencyCode(rawCurrency) ? rawCurrency : 'ILS';

    return {
      branchName,
      address: branch.address?.trim() || undefined,
      phone: branch.phone?.trim() || undefined,
      countryCode: branch.countryCode?.trim().toUpperCase() || undefined,
      operatingCurrencyCode,
    };
  }

  private async validateOwnerInput(owner: OwnerInput) {
    const ownerName = owner?.name?.trim();
    const ownerEmail = owner?.email?.trim().toLowerCase();
    const ownerPassword = owner?.password ?? '';

    if (!ownerName || !ownerEmail?.includes('@')) {
      throw new BadRequestException(
        'Owner name and a valid email are required.',
      );
    }
    if (ownerPassword.length < 6) {
      throw new BadRequestException(
        'Owner password must be at least 6 characters.',
      );
    }

    // Sign-in looks up users by email across ALL tenants with no
    // tenant-scoping (see AuthService.signIn) — two tenants sharing an email
    // would make one of them permanently unable to sign in. Not a full fix
    // (that needs tenant-scoped sign-in), but stops new collisions. This is
    // deliberate: each gym's staff accounts are meant to be fully separate
    // logins, even for the same person working at two tenants.
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: ownerEmail, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException(
        'That owner email is already in use by another organization.',
      );
    }

    return {
      ownerName,
      ownerEmail,
      passwordHash: hashPassword(ownerPassword),
    };
  }

  private async validateOrgCode(rawCode: string): Promise<string> {
    const code = rawCode?.trim().toUpperCase();
    if (!code || !/^[A-Z]{2}$/.test(code)) {
      throw new BadRequestException(
        'Organization code must be exactly 2 letters (e.g. "PF").',
      );
    }

    // Prefixed onto every member/employee number this tenant creates (see
    // apps/api/src/common/org-numbering.ts), so — same shape as the
    // owner-email collision check above — it must be unique across ALL
    // tenants, not just checked within one.
    const existing = await this.prisma.tenant.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException(
        `The code "${code}" is already used by another organization. Please agree on a different 2-letter code with the club.`,
      );
    }

    return code;
  }

  async createTenant(input: CreateTenantInput): Promise<TenantSummary> {
    const tenantName = input.tenantName?.trim();
    if (!tenantName) {
      throw new BadRequestException('Organization name is required.');
    }

    const code = await this.validateOrgCode(input.code);
    const branch = this.validateBranchInput(input.branch);
    const owner = await this.validateOwnerInput(input.owner);

    const tenantId = `tenant-${randomUUID()}`;
    const branchId = `branch-${randomUUID()}`;
    const employeeId = `employee-${randomUUID()}`;
    const employeeNumber = await nextEmployeeNumber(this.prisma, tenantId, code);

    await this.prisma.$transaction([
      this.prisma.tenant.create({
        data: { id: tenantId, name: tenantName, code },
      }),
      this.prisma.branch.create({
        data: {
          id: branchId,
          tenantId,
          name: branch.branchName,
          address: branch.address,
          phone: branch.phone,
          countryCode: branch.countryCode,
          operatingCurrencyCode: branch.operatingCurrencyCode,
          status: 'active',
        },
      }),
      // Every user account is someone's staff identity (see
      // AuthService.createUser) — give the owner an Employee record here too,
      // so they're never shown as "Not linked" like an orphan account.
      this.prisma.employee.create({
        data: {
          id: employeeId,
          tenantId,
          branchId,
          employeeNumber,
          fullName: owner.ownerName,
          status: 'active',
          job: 'Owner',
          startDate: new Date(),
          isUser: true,
        },
      }),
      this.prisma.user.create({
        data: {
          id: `user-${randomUUID()}`,
          tenantId,
          email: owner.ownerEmail,
          name: owner.ownerName,
          role: 'owner',
          passwordHash: owner.passwordHash,
          branchId,
          branchName: branch.branchName,
          employeeId,
        },
      }),
    ]);

    return {
      id: tenantId,
      name: tenantName,
      code,
      createdAt: new Date(),
      branchCount: 1,
      ownerEmail: owner.ownerEmail,
      status: 'active',
      pausedReason: null,
      pausedAt: null,
    };
  }

  async listBranches(tenantId: string): Promise<BranchSummary[]> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    const [branches, owners] = await Promise.all([
      this.prisma.branch.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
      this.prisma.user.findMany({
        where: { tenantId, role: 'owner' },
        select: { branchId: true, name: true, email: true },
      }),
    ]);

    const ownerByBranchId = new Map(owners.map((owner) => [owner.branchId, owner]));

    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      countryCode: branch.countryCode,
      operatingCurrencyCode: branch.operatingCurrencyCode,
      status: branch.status,
      ownerName: ownerByBranchId.get(branch.id)?.name ?? null,
      ownerEmail: ownerByBranchId.get(branch.id)?.email ?? null,
    }));
  }

  async addBranch(tenantId: string, input: AddBranchInput): Promise<BranchSummary> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    const branch = this.validateBranchInput(input.branch);
    const owner = await this.validateOwnerInput(input.owner);

    const branchId = `branch-${randomUUID()}`;
    const employeeId = `employee-${randomUUID()}`;
    const employeeNumber = await nextEmployeeNumber(this.prisma, tenantId, tenant.code);

    await this.prisma.$transaction([
      this.prisma.branch.create({
        data: {
          id: branchId,
          tenantId,
          name: branch.branchName,
          address: branch.address,
          phone: branch.phone,
          countryCode: branch.countryCode,
          operatingCurrencyCode: branch.operatingCurrencyCode,
          status: 'active',
        },
      }),
      this.prisma.employee.create({
        data: {
          id: employeeId,
          tenantId,
          branchId,
          employeeNumber,
          fullName: owner.ownerName,
          status: 'active',
          job: 'Owner',
          startDate: new Date(),
          isUser: true,
        },
      }),
      this.prisma.user.create({
        data: {
          id: `user-${randomUUID()}`,
          tenantId,
          email: owner.ownerEmail,
          name: owner.ownerName,
          role: 'owner',
          passwordHash: owner.passwordHash,
          branchId,
          branchName: branch.branchName,
          employeeId,
        },
      }),
    ]);

    return {
      id: branchId,
      name: branch.branchName,
      address: branch.address ?? null,
      phone: branch.phone ?? null,
      countryCode: branch.countryCode ?? null,
      operatingCurrencyCode: branch.operatingCurrencyCode,
      status: 'active',
      ownerName: owner.ownerName,
      ownerEmail: owner.ownerEmail,
    };
  }

  async updateBranch(
    tenantId: string,
    branchId: string,
    input: UpdateBranchInput,
  ): Promise<BranchSummary> {
    const branchRecord = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });
    if (!branchRecord) {
      throw new NotFoundException('Branch not found.');
    }

    const branch = this.validateBranchInput(input.branch);

    const owner = await this.prisma.user.findFirst({
      where: { tenantId, branchId, role: 'owner' },
    });

    const ownerName = input.owner?.name?.trim();
    const ownerEmail = input.owner?.email?.trim().toLowerCase();

    if (owner && (ownerName || ownerEmail)) {
      if (ownerEmail && !ownerEmail.includes('@')) {
        throw new BadRequestException('A valid owner email is required.');
      }

      if (ownerEmail && ownerEmail !== owner.email) {
        // Same collision check as createTenant/addBranch: sign-in looks up
        // users by email across all tenants, so the new email must be free.
        const existing = await this.prisma.user.findFirst({
          where: {
            email: { equals: ownerEmail, mode: 'insensitive' },
            NOT: { id: owner.id },
          },
        });
        if (existing) {
          throw new BadRequestException(
            'That owner email is already in use by another organization.',
          );
        }
      }

      await this.prisma.user.update({
        where: { id: owner.id },
        data: {
          name: ownerName || owner.name,
          email: ownerEmail || owner.email,
        },
      });
    }

    const updated = await this.prisma.branch.update({
      where: { id: branchId },
      data: {
        name: branch.branchName,
        address: branch.address ?? null,
        phone: branch.phone ?? null,
        countryCode: branch.countryCode ?? null,
        operatingCurrencyCode: branch.operatingCurrencyCode,
      },
    });

    const refreshedOwner = owner
      ? await this.prisma.user.findUnique({ where: { id: owner.id } })
      : null;

    return {
      id: updated.id,
      name: updated.name,
      address: updated.address,
      phone: updated.phone,
      countryCode: updated.countryCode,
      operatingCurrencyCode: updated.operatingCurrencyCode,
      status: updated.status,
      ownerName: refreshedOwner?.name ?? null,
      ownerEmail: refreshedOwner?.email ?? null,
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
      code: updated.code,
      createdAt: updated.createdAt,
      branchCount: tenant.branches.length,
      ownerEmail: tenant.users[0]?.email ?? null,
      status: updated.status,
      pausedReason: updated.pausedReason,
      pausedAt: updated.pausedAt,
    };
  }

  async pauseTenant(tenantId: string, reason: string): Promise<TenantSummary> {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      throw new BadRequestException('A reason is required to pause an organization.');
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
      data: { status: 'paused', pausedReason: trimmedReason, pausedAt: new Date() },
    });

    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      createdAt: updated.createdAt,
      branchCount: tenant.branches.length,
      ownerEmail: tenant.users[0]?.email ?? null,
      status: updated.status,
      pausedReason: updated.pausedReason,
      pausedAt: updated.pausedAt,
    };
  }

  async resumeTenant(tenantId: string): Promise<TenantSummary> {
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
      data: { status: 'active', pausedReason: null, pausedAt: null },
    });

    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      createdAt: updated.createdAt,
      branchCount: tenant.branches.length,
      ownerEmail: tenant.users[0]?.email ?? null,
      status: updated.status,
      pausedReason: updated.pausedReason,
      pausedAt: updated.pausedAt,
    };
  }
}
