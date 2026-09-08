import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { parsePercent, toNumber } from '../../common/decimal';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountType } from '../../generated/prisma/client';

type CreateDiscountTypeInput = {
  name?: string;
  nameAr?: string;
  nameHe?: string;
  description?: string;
  defaultPercent?: number;
};

type UpdateDiscountTypeInput = {
  name?: string;
  nameAr?: string | null;
  nameHe?: string | null;
  description?: string | null;
  defaultPercent?: number;
  isActive?: boolean;
};

@Injectable()
export class DiscountTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForTenant(tenantId: string, options: { includeInactive?: boolean } = {}) {
    const types = await this.prisma.discountType.findMany({
      where: {
        tenantId,
        ...(options.includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
    return types.map((t) => this.serialize(t));
  }

  async getForTenant(tenantId: string, discountTypeId: string) {
    const type = await this.prisma.discountType.findFirst({
      where: { id: discountTypeId, tenantId },
    });

    if (!type) {
      throw new NotFoundException('Discount type not found.');
    }

    return this.serialize(type);
  }

  async create(tenantId: string, input: CreateDiscountTypeInput) {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException('Name is required.');
    }

    const type = await this.prisma.discountType.create({
      data: {
        id: `discount-type-${randomUUID()}`,
        tenantId,
        name,
        nameAr: input.nameAr?.trim() || null,
        nameHe: input.nameHe?.trim() || null,
        description: input.description?.trim() || null,
        defaultPercent: parsePercent(input.defaultPercent, 'Default discount percentage'),
        isActive: true,
      },
    });

    return this.serialize(type);
  }

  async update(tenantId: string, discountTypeId: string, input: UpdateDiscountTypeInput) {
    const current = await this.prisma.discountType.findFirst({
      where: { id: discountTypeId, tenantId },
    });

    if (!current) {
      throw new NotFoundException('Discount type not found.');
    }

    const name = input.name === undefined ? current.name : input.name.trim();

    if (!name) {
      throw new BadRequestException('Name is required.');
    }

    const type = await this.prisma.discountType.update({
      where: { id: discountTypeId },
      data: {
        name,
        nameAr: input.nameAr === undefined ? current.nameAr : input.nameAr?.trim() || null,
        nameHe: input.nameHe === undefined ? current.nameHe : input.nameHe?.trim() || null,
        description:
          input.description === undefined ? current.description : input.description?.trim() || null,
        defaultPercent:
          input.defaultPercent === undefined
            ? current.defaultPercent
            : parsePercent(input.defaultPercent, 'Default discount percentage'),
        isActive: input.isActive ?? current.isActive,
      },
    });

    return this.serialize(type);
  }

  // discount.md §7 DELETE: prefer deactivation, and never physically remove
  // a type that historical memberships still reference.
  async deactivate(tenantId: string, discountTypeId: string) {
    return this.update(tenantId, discountTypeId, { isActive: false });
  }

  async reactivate(tenantId: string, discountTypeId: string) {
    return this.update(tenantId, discountTypeId, { isActive: true });
  }

  /** Validates a discount type belongs to the tenant and is currently
   * selectable for a new membership (active). Returns null unchanged for
   * "None". Throws on a cross-tenant id or an inactive type. */
  async requireActiveForNewMembership(
    tenantId: string,
    discountTypeId: string | null | undefined,
  ): Promise<DiscountType | null> {
    if (!discountTypeId) {
      return null;
    }

    const type = await this.prisma.discountType.findFirst({
      where: { id: discountTypeId, tenantId },
    });

    if (!type) {
      throw new BadRequestException('Discount type is invalid for this tenant.');
    }

    if (!type.isActive) {
      throw new BadRequestException('This discount type is no longer active.');
    }

    return type;
  }

  private serialize(type: DiscountType) {
    return { ...type, defaultPercent: toNumber(type.defaultPercent) };
  }
}
