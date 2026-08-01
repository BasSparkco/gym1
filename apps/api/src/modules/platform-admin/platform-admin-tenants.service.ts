import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword } from '../../common/password';
import { isValidCurrencyCode } from '../../common/currencies';

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
  branch: BranchInput;
  owner: OwnerInput;
};

export type AddBranchInput = {
  branch: BranchInput;
  owner: OwnerInput;
};

export type TenantSummary = {
  id: string;
  name: string;
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
  countryCode: string | null;
  operatingCurrencyCode: string;
  status: 'active' | 'inactive';
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

  // Mirrors EmployeesService.createEmployee's numbering scheme so
  // platform-admin-created owners get employeeNumbers indistinguishable from
  // ones created through the normal /app/employees flow.
  private async nextEmployeeNumber(tenantId: string): Promise<string> {
    const tenantEmployees = await this.prisma.employee.findMany({
      where: { tenantId },
      select: { employeeNumber: true },
    });

    const maxSeq = tenantEmployees.reduce((max, e) => {
      const match = e.employeeNumber.match(/^EMP-(\d{4})$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    return `EMP-${String(maxSeq + 1).padStart(4, '0')}`;
  }

  async createTenant(input: CreateTenantInput): Promise<TenantSummary> {
    const tenantName = input.tenantName?.trim();
    if (!tenantName) {
      throw new BadRequestException('Organization name is required.');
    }

    const branch = this.validateBranchInput(input.branch);
    const owner = await this.validateOwnerInput(input.owner);

    const tenantId = `tenant-${randomUUID()}`;
    const branchId = `branch-${randomUUID()}`;
    const employeeId = `employee-${randomUUID()}`;
    const employeeNumber = await this.nextEmployeeNumber(tenantId);

    await this.prisma.$transaction([
      this.prisma.tenant.create({
        data: { id: tenantId, name: tenantName },
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
        select: { branchId: true, email: true },
      }),
    ]);

    const ownerEmailByBranchId = new Map(owners.map((owner) => [owner.branchId, owner.email]));

    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      countryCode: branch.countryCode,
      operatingCurrencyCode: branch.operatingCurrencyCode,
      status: branch.status,
      ownerEmail: ownerEmailByBranchId.get(branch.id) ?? null,
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
    const employeeNumber = await this.nextEmployeeNumber(tenantId);

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
      countryCode: branch.countryCode ?? null,
      operatingCurrencyCode: branch.operatingCurrencyCode,
      status: 'active',
      ownerEmail: owner.ownerEmail,
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
      createdAt: updated.createdAt,
      branchCount: tenant.branches.length,
      ownerEmail: tenant.users[0]?.email ?? null,
      status: updated.status,
      pausedReason: updated.pausedReason,
      pausedAt: updated.pausedAt,
    };
  }
}
