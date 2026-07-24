import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ClassBooking, Prisma } from '../../generated/prisma/client';

@Injectable()
export class ClassBookingsService {
  private readonly logger = new Logger(ClassBookingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** A booking that's still `booked` well after its session ended with no
   * matching check-in becomes a no-show. Runs hourly rather than daily since
   * class sessions are short-lived compared to memberships. */
  @Cron(CronExpression.EVERY_HOUR)
  async sweepNoShows(): Promise<void> {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    try {
      const result = await this.prisma.classBooking.updateMany({
        where: {
          status: 'booked',
          classSession: { endTime: { lt: cutoff } },
        },
        data: { status: 'noShow' },
      });
      if (result.count > 0) {
        this.logger.log(`Marked ${result.count} booking(s) as no-show.`);
      }
    } catch (error) {
      this.logger.error(`No-show sweep failed: ${(error as Error).message}`);
    }
  }

  async listBookingsForSession(tenantId: string, classSessionId: string) {
    await this.assertSessionInTenant(tenantId, classSessionId);
    const bookings = await this.prisma.classBooking.findMany({
      where: { classSessionId },
      include: { member: true },
      orderBy: { bookedAt: 'asc' },
    });
    return bookings.map((b) => this.serialize(b));
  }

  async listBookingsForMember(tenantId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const bookings = await this.prisma.classBooking.findMany({
      where: { memberId },
      include: { classSession: { include: { program: true } } },
      orderBy: { bookedAt: 'desc' },
    });
    return bookings.map((b) => this.serialize(b));
  }

  async bookClass(tenantId: string, input: { classSessionId?: string; memberId?: string }) {
    if (!input.classSessionId || !input.memberId) {
      throw new BadRequestException('Class session and member are required.');
    }

    const classSessionId = input.classSessionId;
    const memberId = input.memberId;

    const classSession = await this.prisma.classSession.findFirst({
      where: { id: classSessionId, tenantId },
    });
    if (!classSession) {
      throw new BadRequestException('Class session is invalid for this tenant.');
    }
    if (classSession.status !== 'scheduled') {
      throw new BadRequestException('This class is not open for booking.');
    }

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) {
      throw new BadRequestException('Member is invalid for this tenant.');
    }

    const enrollment = await this.activeEnrollmentFor(
      memberId,
      classSession.programId,
    );
    if (!enrollment) {
      throw new BadRequestException(
        'Member must be registered for this course before booking a class.',
      );
    }

    await this.assertNoOverlap(memberId, classSession, undefined);

    return this.prisma.$transaction(async (tx) => {
      // Row-lock the session so two concurrent bookings can't both read the
      // same "seats remaining" count and both insert as `booked`.
      await tx.$queryRaw`SELECT id FROM "ClassSession" WHERE id = ${classSessionId} FOR UPDATE`;

      const bookedCount = await tx.classBooking.count({
        where: { classSessionId, status: 'booked' },
      });

      const status = bookedCount < classSession.capacity ? 'booked' : 'waitlisted';

      const booking = await tx.classBooking.create({
        data: {
          id: `booking-${randomUUID()}`,
          classSessionId,
          memberId,
          status,
        },
      });

      return this.serialize(booking);
    });
  }

  async markAttendance(
    tenantId: string,
    bookingId: string,
    status: 'attended' | 'noShow',
  ) {
    const booking = await this.prisma.classBooking.findFirst({
      where: { id: bookingId, classSession: { tenantId } },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestException(
        'Cannot mark attendance on a cancelled booking.',
      );
    }

    const updated = await this.prisma.classBooking.update({
      where: { id: bookingId },
      data: { status },
    });

    return this.serialize(updated);
  }

  async cancelBooking(tenantId: string, bookingId: string) {
    const booking = await this.prisma.classBooking.findFirst({
      where: { id: bookingId, classSession: { tenantId } },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking is already cancelled.');
    }

    const wasBooked = booking.status === 'booked';

    return this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.classBooking.update({
        where: { id: bookingId },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });

      if (wasBooked) {
        await this.promoteNextWaitlisted(tx, booking.classSessionId);
      }

      return this.serialize(cancelled);
    });
  }

  /** Promotes the oldest waitlisted booking to `booked`, re-validating the
   * member's course registration at promotion time (they could have
   * unregistered since joining the waitlist). Skips invalid candidates and
   * tries the next one rather than leaving the seat empty. */
  private async promoteNextWaitlisted(
    tx: Prisma.TransactionClient,
    classSessionId: string,
  ): Promise<void> {
    const waitlisted = await tx.classBooking.findMany({
      where: { classSessionId, status: 'waitlisted' },
      orderBy: { bookedAt: 'asc' },
    });

    if (waitlisted.length === 0) return;

    const session = await tx.classSession.findUnique({
      where: { id: classSessionId },
    });

    for (const candidate of waitlisted) {
      const enrollment = await tx.programEnrollment.findUnique({
        where: {
          programId_memberId: {
            programId: session!.programId,
            memberId: candidate.memberId,
          },
        },
      });

      if (!enrollment || enrollment.status !== 'active') {
        continue;
      }

      await tx.classBooking.update({
        where: { id: candidate.id },
        data: { status: 'booked' },
      });
      return;
    }
  }

  private async activeEnrollmentFor(memberId: string, programId: string) {
    const enrollment = await this.prisma.programEnrollment.findUnique({
      where: { programId_memberId: { programId, memberId } },
    });
    return enrollment?.status === 'active' ? enrollment : null;
  }

  private async assertNoOverlap(
    memberId: string,
    classSession: { id: string; date: Date; startTime: Date; endTime: Date },
    excludeBookingId: string | undefined,
  ) {
    const overlapping = await this.prisma.classBooking.findFirst({
      where: {
        memberId,
        status: { in: ['booked', 'waitlisted'] },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        classSession: {
          date: classSession.date,
          startTime: { lt: classSession.endTime },
          endTime: { gt: classSession.startTime },
        },
      },
    });

    if (overlapping) {
      throw new BadRequestException(
        'Member already has a booking that overlaps this class time.',
      );
    }
  }

  private async assertSessionInTenant(tenantId: string, classSessionId: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: classSessionId, tenantId },
    });
    if (!session) {
      throw new NotFoundException('Class session not found.');
    }
  }

  private serialize(booking: ClassBooking & Record<string, unknown>) {
    return { ...booking };
  }
}
