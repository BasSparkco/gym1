import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { addDays, localDateString, toDateOnlyString } from '../../common/date';
import { toNumber } from '../../common/decimal';
import { DebtService } from '../debt/debt.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Locker,
  LockerRental,
  LockerRentalStatus,
  LockerSize,
  LockerStatus,
  Prisma,
} from '../../generated/prisma/client';

type CreateLockerInput = {
  branchId?: string;
  lockerNumber?: string;
  size?: LockerSize | null;
  monthlyPrice?: number;
};

type CreateLockersBulkInput = {
  branchId?: string;
  startNumber?: string;
  quantity?: number;
  size?: LockerSize | null;
  monthlyPrice?: number;
};

type UpdateLockerInput = {
  lockerNumber?: string;
  size?: LockerSize | null;
  monthlyPrice?: number;
  status?: LockerStatus;
};

type CreateLockerRentalInput = {
  lockerId?: string;
  memberId?: string;
  startDate?: string;
  endDate?: string;
  finalPrice?: number;
};

function toDateOnly(dateStr: string): Date {
  return new Date(dateStr);
}

@Injectable()
export class LockersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly debtService: DebtService,
  ) {}

  private async autoExpireStaleForTenant(tenantId: string): Promise<void> {
    const today = toDateOnly(localDateString());
    const stale = await this.prisma.lockerRental.findMany({
      where: {
        locker: { tenantId },
        status: 'active',
        endDate: { lt: today },
      },
    });

    if (stale.length === 0) return;

    await this.prisma.$transaction([
      this.prisma.lockerRental.updateMany({
        where: { id: { in: stale.map((r) => r.id) } },
        data: { status: 'expired' },
      }),
      this.prisma.locker.updateMany({
        where: { id: { in: stale.map((r) => r.lockerId) } },
        data: { status: 'available' },
      }),
    ]);
  }

  async listLockers(
    tenantId: string,
    options: { scopedBranchId?: string; branchId?: string; memberId?: string } = {},
  ) {
    await this.autoExpireStaleForTenant(tenantId);

    let branchId = options.scopedBranchId ?? options.branchId;

    if (options.memberId) {
      const member = await this.prisma.member.findFirst({
        where: {
          id: options.memberId,
          tenantId,
          ...(options.scopedBranchId ? { homeBranchId: options.scopedBranchId } : {}),
        },
        select: { homeBranchId: true },
      });

      if (!member) {
        throw new NotFoundException('Member not found.');
      }

      branchId = member.homeBranchId;
    }

    const lockers = await this.prisma.locker.findMany({
      where: { tenantId, ...(branchId ? { branchId } : {}) },
    });
    return lockers
      .slice()
      .sort((a, b) => a.lockerNumber.localeCompare(b.lockerNumber))
      .map((l) => this.serializeLocker(l));
  }

  async getLockerForTenant(tenantId: string, lockerId: string) {
    await this.autoExpireStaleForTenant(tenantId);

    const locker = await this.prisma.locker.findFirst({
      where: { id: lockerId, tenantId },
    });

    if (!locker) {
      throw new NotFoundException('Locker not found.');
    }

    const activeRental = await this.prisma.lockerRental.findFirst({
      where: { lockerId, status: 'active' },
      include: { member: true },
    });

    return {
      ...this.serializeLocker(locker),
      activeRental: activeRental
        ? {
            ...this.serializeRental(activeRental),
            member: {
              id: activeRental.member.id,
              fullName: activeRental.member.fullName,
              memberNumber: activeRental.member.memberNumber,
            },
          }
        : null,
    };
  }

  async createLocker(tenantId: string, input: CreateLockerInput) {
    const lockerNumber = input.lockerNumber?.trim();

    if (!input.branchId || !lockerNumber) {
      throw new BadRequestException('Branch and locker number are required.');
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: input.branchId, tenantId },
    });

    if (!branch) {
      throw new BadRequestException('Branch is invalid for this tenant.');
    }

    const existing = await this.prisma.locker.findFirst({
      where: { branchId: input.branchId, lockerNumber },
    });

    if (existing) {
      throw new BadRequestException(
        `Locker ${lockerNumber} already exists at this branch.`,
      );
    }

    let locker: Locker;
    try {
      locker = await this.prisma.locker.create({
        data: {
          id: `locker-${randomUUID()}`,
          tenantId,
          branchId: input.branchId,
          lockerNumber,
          size: input.size ?? null,
          monthlyPrice: input.monthlyPrice ?? 0,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          `Locker ${lockerNumber} already exists at this branch.`,
        );
      }
      throw err;
    }

    return this.serializeLocker(locker);
  }

  async createLockersBulk(tenantId: string, input: CreateLockersBulkInput) {
    const quantity = input.quantity ?? 0;

    if (!input.branchId || !input.startNumber?.trim()) {
      throw new BadRequestException(
        'Branch and starting locker number are required.',
      );
    }

    const startNumber = Number(input.startNumber.trim());
    if (!Number.isInteger(startNumber)) {
      throw new BadRequestException(
        'Creating multiple lockers requires a numeric starting locker number.',
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
      throw new BadRequestException('Quantity must be between 1 and 500.');
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: input.branchId, tenantId },
    });

    if (!branch) {
      throw new BadRequestException('Branch is invalid for this tenant.');
    }

    const lockerNumbers = Array.from({ length: quantity }, (_, i) =>
      String(startNumber + i),
    );

    const clashing = await this.prisma.locker.findMany({
      where: { branchId: input.branchId, lockerNumber: { in: lockerNumbers } },
      select: { lockerNumber: true },
    });

    if (clashing.length > 0) {
      const numbers = clashing
        .map((l) => l.lockerNumber)
        .sort((a, b) => Number(a) - Number(b))
        .join(', ');
      throw new BadRequestException(
        `Locker number${clashing.length > 1 ? 's' : ''} ${numbers} already exist${clashing.length > 1 ? '' : 's'} at this branch.`,
      );
    }

    try {
      const created = await this.prisma.$transaction(
        lockerNumbers.map((lockerNumber) =>
          this.prisma.locker.create({
            data: {
              id: `locker-${randomUUID()}`,
              tenantId,
              branchId: input.branchId as string,
              lockerNumber,
              size: input.size ?? null,
              monthlyPrice: input.monthlyPrice ?? 0,
            },
          }),
        ),
      );

      return created.map((locker) => this.serializeLocker(locker));
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          'One or more of these locker numbers were just taken by someone else. Please try again.',
        );
      }
      throw err;
    }
  }

  async updateLocker(
    tenantId: string,
    lockerId: string,
    input: UpdateLockerInput,
  ) {
    const current = await this.prisma.locker.findFirst({
      where: { id: lockerId, tenantId },
    });

    if (!current) {
      throw new NotFoundException('Locker not found.');
    }

    const lockerNumber =
      input.lockerNumber === undefined
        ? current.lockerNumber
        : input.lockerNumber.trim();

    if (!lockerNumber) {
      throw new BadRequestException('Locker number is required.');
    }

    if (lockerNumber !== current.lockerNumber) {
      const clash = await this.prisma.locker.findFirst({
        where: { branchId: current.branchId, lockerNumber },
      });
      if (clash) {
        throw new BadRequestException(
          `Locker ${lockerNumber} already exists at this branch.`,
        );
      }
    }

    const locker = await this.prisma.locker.update({
      where: { id: lockerId },
      data: {
        lockerNumber,
        size: input.size === undefined ? current.size : input.size,
        monthlyPrice: input.monthlyPrice ?? current.monthlyPrice,
        status: input.status ?? current.status,
      },
    });

    return this.serializeLocker(locker);
  }

  async deleteLocker(tenantId: string, lockerId: string): Promise<void> {
    const current = await this.prisma.locker.findFirst({
      where: { id: lockerId, tenantId },
    });

    if (!current) {
      throw new NotFoundException('Locker not found.');
    }

    const hasRentalHistory = await this.prisma.lockerRental.findFirst({
      where: { lockerId },
    });

    if (hasRentalHistory) {
      throw new BadRequestException(
        'Cannot delete a locker with rental history. Set it to maintenance instead.',
      );
    }

    await this.prisma.locker.delete({ where: { id: lockerId } });
  }

  async listRentalsForMember(tenantId: string, memberId: string) {
    await this.autoExpireStaleForTenant(tenantId);

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const rentals = await this.prisma.lockerRental.findMany({
      where: { memberId },
      include: { locker: true },
    });

    return rentals.map((r) => ({
      ...this.serializeRental(r),
      locker: this.serializeLocker(r.locker),
    }));
  }

  async createRental(tenantId: string, input: CreateLockerRentalInput) {
    if (!input.lockerId || !input.memberId || !input.startDate) {
      throw new BadRequestException(
        'Locker, member, and start date are required.',
      );
    }

    await this.autoExpireStaleForTenant(tenantId);

    const locker = await this.prisma.locker.findFirst({
      where: { id: input.lockerId, tenantId },
    });
    const member = await this.prisma.member.findFirst({
      where: { id: input.memberId, tenantId },
    });

    if (!locker) {
      throw new BadRequestException('Locker is invalid for this tenant.');
    }

    if (!member) {
      throw new BadRequestException('Member is invalid for this tenant.');
    }

    if (locker.status !== 'available') {
      throw new BadRequestException('This locker is not available.');
    }

    const existingActive = await this.prisma.lockerRental.findFirst({
      where: { memberId: member.id, status: 'active' },
    });

    if (existingActive) {
      throw new BadRequestException(
        'Member already has an active locker rental.',
      );
    }

    const endDate = input.endDate ?? addDays(input.startDate, 30);

    const [rental] = await this.prisma.$transaction([
      this.prisma.lockerRental.create({
        data: {
          id: `locker-rental-${randomUUID()}`,
          lockerId: locker.id,
          memberId: member.id,
          startDate: toDateOnly(input.startDate),
          endDate: toDateOnly(endDate),
          status: 'active',
          finalPrice: input.finalPrice ?? locker.monthlyPrice,
        },
      }),
      this.prisma.locker.update({
        where: { id: locker.id },
        data: { status: 'occupied' },
      }),
    ]);

    await this.debtService.recompute(rental.memberId);

    return {
      ...this.serializeRental(rental),
      locker: this.serializeLocker({ ...locker, status: 'occupied' }),
    };
  }

  async cancelRental(tenantId: string, rentalId: string) {
    const rental = await this.prisma.lockerRental.findFirst({
      where: { id: rentalId, member: { tenantId } },
      include: { locker: true },
    });

    if (!rental) {
      throw new NotFoundException('Locker rental not found.');
    }

    if (rental.status !== 'active') {
      throw new BadRequestException('Only active rentals can be cancelled.');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.lockerRental.update({
        where: { id: rentalId },
        data: { status: 'cancelled' },
      }),
      this.prisma.locker.update({
        where: { id: rental.lockerId },
        data: { status: 'available' },
      }),
    ]);

    await this.debtService.recompute(rental.memberId);

    return this.serializeRental(updated);
  }

  private serializeLocker(locker: Locker) {
    return { ...locker, monthlyPrice: toNumber(locker.monthlyPrice) };
  }

  private serializeRental(rental: LockerRental) {
    return {
      ...rental,
      startDate: toDateOnlyString(rental.startDate),
      endDate: toDateOnlyString(rental.endDate),
      finalPrice: toNumber(rental.finalPrice),
    };
  }
}

// Re-exported so the controller can type request bodies without reaching
// into the generated client directly.
export type { LockerRentalStatus };
