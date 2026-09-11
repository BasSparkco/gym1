import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  listAreasForTenant(tenantId: string) {
    return this.prisma.area.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Staff can add a new area on the fly (e.g. from the member form's "add
   * new" popup), often re-typing a name that already exists — returns the
   * existing row instead of throwing so that isn't treated as an error.
   */
  async createArea(tenantId: string, name: string | undefined) {
    const trimmed = name?.trim();

    if (!trimmed) {
      throw new BadRequestException('Area name is required.');
    }

    const existing = await this.prisma.area.findFirst({
      where: { tenantId, name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.area.create({
      data: {
        id: `area-${randomUUID()}`,
        tenantId,
        name: trimmed,
      },
    });
  }

  async ensureAreaBelongsToTenant(tenantId: string, areaId: string) {
    const area = await this.prisma.area.findFirst({
      where: { id: areaId, tenantId },
    });

    if (!area) {
      throw new BadRequestException('Area is invalid for this tenant.');
    }

    return area;
  }
}
