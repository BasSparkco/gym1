import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  GateRecord,
  readOperationsStore,
  writeOperationsStore,
} from '../../data/operations-store';

export type CreateGateInput = {
  branchId: string;
  name: string;
  genderRestriction: 'male' | 'female' | null;
  deviceUrl: string;
  deviceUsername: string;
  devicePassword: string;
  lockNumber?: number;
  enabled?: boolean;
};

export type UpdateGateInput = Partial<CreateGateInput>;

@Injectable()
export class GatesService {
  listGates(tenantId: string, branchId?: string): GateRecord[] {
    const store = readOperationsStore();
    return store.gates.filter(
      (g) =>
        g.tenantId === tenantId && (branchId == null || g.branchId === branchId),
    );
  }

  getGate(tenantId: string, gateId: string): GateRecord | null {
    const store = readOperationsStore();
    return (
      store.gates.find((g) => g.id === gateId && g.tenantId === tenantId) ??
      null
    );
  }

  createGate(tenantId: string, input: CreateGateInput): GateRecord {
    const store = readOperationsStore();

    const branch = store.branches.find(
      (b) => b.id === input.branchId && b.tenantId === tenantId,
    );
    if (!branch) {
      throw new BadRequestException('Branch not found.');
    }

    const gate: GateRecord = {
      id: `gate-${randomUUID()}`,
      tenantId,
      branchId: input.branchId,
      name: input.name.trim(),
      genderRestriction: input.genderRestriction,
      deviceUrl: input.deviceUrl.trim().replace(/\/$/, ''),
      deviceUsername: input.deviceUsername.trim(),
      devicePassword: input.devicePassword,
      lockNumber: input.lockNumber ?? 1,
      enabled: input.enabled ?? true,
    };

    store.gates.push(gate);
    writeOperationsStore(store);
    return gate;
  }

  updateGate(
    tenantId: string,
    gateId: string,
    input: UpdateGateInput,
  ): GateRecord {
    const store = readOperationsStore();
    const idx = store.gates.findIndex(
      (g) => g.id === gateId && g.tenantId === tenantId,
    );
    if (idx === -1) throw new NotFoundException('Gate not found.');

    if (input.branchId != null) {
      const branch = store.branches.find(
        (b) => b.id === input.branchId && b.tenantId === tenantId,
      );
      if (!branch) throw new BadRequestException('Branch not found.');
    }

    const current = store.gates[idx];
    const updated: GateRecord = {
      ...current,
      ...(input.branchId != null && { branchId: input.branchId }),
      ...(input.name != null && { name: input.name.trim() }),
      ...(input.genderRestriction !== undefined && {
        genderRestriction: input.genderRestriction,
      }),
      ...(input.deviceUrl != null && {
        deviceUrl: input.deviceUrl.trim().replace(/\/$/, ''),
      }),
      ...(input.deviceUsername != null && {
        deviceUsername: input.deviceUsername.trim(),
      }),
      ...(input.devicePassword != null && {
        devicePassword: input.devicePassword,
      }),
      ...(input.lockNumber != null && { lockNumber: input.lockNumber }),
      ...(input.enabled != null && { enabled: input.enabled }),
    };

    store.gates[idx] = updated;
    writeOperationsStore(store);
    return updated;
  }

  deleteGate(tenantId: string, gateId: string): void {
    const store = readOperationsStore();
    const idx = store.gates.findIndex(
      (g) => g.id === gateId && g.tenantId === tenantId,
    );
    if (idx === -1) throw new NotFoundException('Gate not found.');
    store.gates.splice(idx, 1);
    writeOperationsStore(store);
  }

  /** Returns gates matching the member's gender (or gates with no restriction). */
  gatesForMember(
    tenantId: string,
    branchId: string,
    memberSex?: 'male' | 'female',
  ): GateRecord[] {
    return this.listGates(tenantId, branchId).filter(
      (g) =>
        g.enabled &&
        (g.genderRestriction === null || g.genderRestriction === memberSex),
    );
  }
}
