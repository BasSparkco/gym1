import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BranchRecord } from '../../data/operations-store';
import { PrismaService } from '../../prisma/prisma.service';

type CreateBranchInput = {
  name?: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  status?: BranchRecord['status'];
};

type UpdateBranchInput = {
  name?: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  status?: BranchRecord['status'];
};

const validBranchStatuses = new Set<BranchRecord['status']>([
  'active',
  'inactive',
]);

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  listBranchesForTenant(tenantId: string) {
    return this.prisma.branch.findMany({ where: { tenantId } });
  }

  async getBranchForTenant(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }

    return branch;
  }

  async createBranch(tenantId: string, input: CreateBranchInput) {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException('Branch name is required.');
    }

    return this.prisma.branch.create({
      data: {
        id: `branch-${randomUUID()}`,
        tenantId,
        name,
        address: input.address?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        countryCode: input.countryCode?.trim().toUpperCase() || undefined,
        status: this.normalizeBranchStatus(input.status),
      },
    });
  }

  async updateBranch(
    tenantId: string,
    branchId: string,
    input: UpdateBranchInput,
  ) {
    const current = await this.getBranchForTenant(tenantId, branchId);

    const nextName =
      input.name === undefined ? current.name : input.name.trim();

    if (!nextName) {
      throw new BadRequestException('Branch name is required.');
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data: {
        name: nextName,
        address:
          input.address === undefined
            ? current.address
            : input.address.trim() || null,
        phone:
          input.phone === undefined
            ? current.phone
            : input.phone.trim() || null,
        countryCode:
          input.countryCode === undefined
            ? current.countryCode
            : input.countryCode.trim().toUpperCase() || null,
        status:
          input.status === undefined
            ? current.status
            : this.normalizeBranchStatus(input.status),
      },
    });
  }

  private normalizeBranchStatus(
    status: BranchRecord['status'] | undefined,
  ): BranchRecord['status'] {
    if (!status) {
      return 'active';
    }

    if (!validBranchStatuses.has(status)) {
      throw new BadRequestException('Branch status is invalid.');
    }

    return status;
  }
}
