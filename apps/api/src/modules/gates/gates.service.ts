import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  listGates(tenantId: string, branchId?: string) {
    return this.prisma.gate.findMany({
      where: { tenantId, ...(branchId != null && { branchId }) },
    });
  }

  async getGate(tenantId: string, gateId: string) {
    return this.prisma.gate.findFirst({ where: { id: gateId, tenantId } });
  }

  async createGate(tenantId: string, input: CreateGateInput) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: input.branchId, tenantId },
    });
    if (!branch) {
      throw new BadRequestException('Branch not found.');
    }

    return this.prisma.gate.create({
      data: {
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
      },
    });
  }

  async updateGate(tenantId: string, gateId: string, input: UpdateGateInput) {
    const current = await this.prisma.gate.findFirst({
      where: { id: gateId, tenantId },
    });
    if (!current) throw new NotFoundException('Gate not found.');

    if (input.branchId != null) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: input.branchId, tenantId },
      });
      if (!branch) throw new BadRequestException('Branch not found.');
    }

    return this.prisma.gate.update({
      where: { id: gateId },
      data: {
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
      },
    });
  }

  async deleteGate(tenantId: string, gateId: string): Promise<void> {
    const current = await this.prisma.gate.findFirst({
      where: { id: gateId, tenantId },
    });
    if (!current) throw new NotFoundException('Gate not found.');

    await this.prisma.gate.delete({ where: { id: gateId } });
  }

  /** Returns gates matching the member's gender (or gates with no restriction). */
  async gatesForMember(
    tenantId: string,
    branchId: string,
    memberSex?: 'male' | 'female',
  ) {
    const gates = await this.listGates(tenantId, branchId);
    return gates.filter(
      (g) =>
        g.enabled &&
        (g.genderRestriction === null || g.genderRestriction === memberSex),
    );
  }
}
