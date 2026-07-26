import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { localDateString, toDateOnlyString } from '../../common/date';
import { PrismaService } from '../../prisma/prisma.service';
import { ClosedDate } from '../../generated/prisma/client';

type CreateClosedDateInput = {
  branchId?: string;
  date?: string;
  reason?: string;
};

function toDateOnly(dateStr: string): Date {
  return new Date(dateStr);
}

@Injectable()
export class ClosedDatesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForTenant(tenantId: string, scopedBranchId?: string) {
    const closedDates = await this.prisma.closedDate.findMany({
      where: {
        tenantId,
        ...(scopedBranchId
          ? { OR: [{ branchId: null }, { branchId: scopedBranchId }] }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
    return closedDates.map((c) => this.serialize(c));
  }

  async listUpcomingForMember(tenantId: string, homeBranchId: string) {
    const today = toDateOnly(localDateString());
    const closedDates = await this.prisma.closedDate.findMany({
      where: {
        tenantId,
        OR: [{ branchId: null }, { branchId: homeBranchId }],
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
    });
    return closedDates.map((c) => this.serialize(c));
  }

  async create(tenantId: string, input: CreateClosedDateInput) {
    if (!input.date || !input.reason?.trim()) {
      throw new BadRequestException('Date and reason are required.');
    }

    if (input.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: input.branchId, tenantId },
      });
      if (!branch) {
        throw new BadRequestException('Branch is invalid for this tenant.');
      }
    }

    const closedDate = await this.prisma.closedDate.create({
      data: {
        id: `closed-date-${randomUUID()}`,
        tenantId,
        branchId: input.branchId ?? null,
        date: toDateOnly(input.date),
        reason: input.reason.trim(),
      },
    });

    return this.serialize(closedDate);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const current = await this.prisma.closedDate.findFirst({
      where: { id, tenantId },
    });

    if (!current) {
      throw new NotFoundException('Closed date not found.');
    }

    await this.prisma.closedDate.delete({ where: { id } });
  }

  private serialize(closedDate: ClosedDate) {
    return { ...closedDate, date: toDateOnlyString(closedDate.date) };
  }
}
