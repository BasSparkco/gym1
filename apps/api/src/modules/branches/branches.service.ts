import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  BranchRecord,
  readOperationsStore,
  writeOperationsStore,
} from '../../data/operations-store';

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
  listBranchesForTenant(tenantId: string) {
    return readOperationsStore().branches.filter(
      (branch) => branch.tenantId === tenantId,
    );
  }

  getBranchForTenant(tenantId: string, branchId: string) {
    const branch = readOperationsStore().branches.find(
      (candidate) =>
        candidate.id === branchId && candidate.tenantId === tenantId,
    );

    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }

    return branch;
  }

  createBranch(tenantId: string, input: CreateBranchInput) {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException('Branch name is required.');
    }

    const store = readOperationsStore();
    const branch: BranchRecord = {
      id: `branch-${randomUUID()}`,
      tenantId,
      name,
      address: input.address?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      countryCode: input.countryCode?.trim().toUpperCase() || undefined,
      status: this.normalizeBranchStatus(input.status),
    };

    store.branches.push(branch);
    writeOperationsStore(store);

    return branch;
  }

  updateBranch(tenantId: string, branchId: string, input: UpdateBranchInput) {
    const store = readOperationsStore();
    const idx = store.branches.findIndex(
      (candidate) =>
        candidate.id === branchId && candidate.tenantId === tenantId,
    );

    if (idx === -1) {
      throw new NotFoundException('Branch not found.');
    }

    const current = store.branches[idx];
    const nextName =
      input.name === undefined ? current.name : input.name.trim();

    if (!nextName) {
      throw new BadRequestException('Branch name is required.');
    }

    const next: BranchRecord = {
      ...current,
      name: nextName,
      address:
        input.address === undefined
          ? current.address
          : input.address.trim() || undefined,
      phone:
        input.phone === undefined
          ? current.phone
          : input.phone.trim() || undefined,
      countryCode:
        input.countryCode === undefined
          ? current.countryCode
          : input.countryCode.trim().toUpperCase() || undefined,
      status:
        input.status === undefined
          ? current.status
          : this.normalizeBranchStatus(input.status),
    };

    store.branches[idx] = next;
    writeOperationsStore(store);

    return next;
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
