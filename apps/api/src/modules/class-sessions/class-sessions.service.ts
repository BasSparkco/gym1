import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { addDays, toDateOnlyString } from '../../common/date';
import { PrismaService } from '../../prisma/prisma.service';
import { ClassSession, ClassSessionStatus } from '../../generated/prisma/client';

type SessionInput = {
  programId?: string;
  branchId?: string;
  coachId?: string | null;
  room?: string;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  capacity?: number;
};

export type CreateClassSessionInput = SessionInput;

export type UpdateClassSessionInput = {
  coachId?: string | null;
  room?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  status?: ClassSessionStatus;
  /** When true and the session belongs to a recurring series, apply the
   * time/room/coach/capacity changes to every future occurrence in the
   * series instead of just this one. */
  applyToSeries?: boolean;
};

export type CreateRecurringClassSessionsInput = SessionInput & {
  repeatWeeks?: number;
};

function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

@Injectable()
export class ClassSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listSessionsForTenant(
    tenantId: string,
    branchId: string | undefined,
    filters: { programId?: string; coachId?: string; from?: string; to?: string },
  ) {
    const sessions = await this.prisma.classSession.findMany({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
        ...(filters.programId ? { programId: filters.programId } : {}),
        ...(filters.coachId ? { coachId: filters.coachId } : {}),
        ...(filters.from || filters.to
          ? {
              date: {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(filters.to) } : {}),
              },
            }
          : {}),
      },
      include: { _count: { select: { bookings: { where: { status: { in: ['booked'] } } } } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    return sessions.map((s) => this.serialize(s));
  }

  async getSessionForTenant(tenantId: string, sessionId: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: sessionId, tenantId },
      include: { _count: { select: { bookings: { where: { status: { in: ['booked'] } } } } } },
    });

    if (!session) {
      throw new NotFoundException('Class session not found.');
    }

    return this.serialize(session);
  }

  async createSession(tenantId: string, input: CreateClassSessionInput) {
    const validated = await this.validateAndNormalize(tenantId, input);
    await this.assertNoConflict(tenantId, validated);

    const session = await this.prisma.classSession.create({
      data: {
        id: `class-session-${randomUUID()}`,
        tenantId,
        branchId: validated.branchId,
        programId: validated.programId,
        coachId: validated.coachId,
        room: validated.room,
        date: validated.date,
        startTime: validated.startTime,
        endTime: validated.endTime,
        capacity: validated.capacity,
      },
    });

    return this.serialize({ ...session, _count: { bookings: 0 } });
  }

  async createRecurringSessions(
    tenantId: string,
    input: CreateRecurringClassSessionsInput,
  ) {
    const repeatWeeks = input.repeatWeeks ?? 1;
    if (repeatWeeks < 1 || repeatWeeks > 52) {
      throw new BadRequestException('repeatWeeks must be between 1 and 52.');
    }
    if (!input.date) {
      throw new BadRequestException('A start date is required.');
    }

    const recurrenceId = `recurrence-${randomUUID()}`;
    const created: ReturnType<ClassSessionsService['serialize']>[] = [];
    const skipped: { date: string; reason: string }[] = [];

    for (let week = 0; week < repeatWeeks; week++) {
      const occurrenceDate = addDays(input.date, week * 7);
      try {
        const validated = await this.validateAndNormalize(tenantId, {
          ...input,
          date: occurrenceDate,
        });
        await this.assertNoConflict(tenantId, validated);

        const session = await this.prisma.classSession.create({
          data: {
            id: `class-session-${randomUUID()}`,
            tenantId,
            branchId: validated.branchId,
            programId: validated.programId,
            coachId: validated.coachId,
            room: validated.room,
            date: validated.date,
            startTime: validated.startTime,
            endTime: validated.endTime,
            capacity: validated.capacity,
            recurrenceId,
          },
        });
        created.push(this.serialize({ ...session, _count: { bookings: 0 } }));
      } catch (error) {
        skipped.push({
          date: occurrenceDate,
          reason: (error as Error).message,
        });
      }
    }

    return { recurrenceId, created, skipped };
  }

  async updateSession(
    tenantId: string,
    sessionId: string,
    input: UpdateClassSessionInput,
  ) {
    const current = await this.prisma.classSession.findFirst({
      where: { id: sessionId, tenantId },
    });

    if (!current) {
      throw new NotFoundException('Class session not found.');
    }

    const targetIds =
      input.applyToSeries && current.recurrenceId
        ? (
            await this.prisma.classSession.findMany({
              where: {
                tenantId,
                recurrenceId: current.recurrenceId,
                date: { gte: current.date },
              },
              select: { id: true },
            })
          ).map((s) => s.id)
        : [sessionId];

    for (const id of targetIds) {
      const target =
        id === sessionId
          ? current
          : await this.prisma.classSession.findFirstOrThrow({ where: { id } });

      const validated = await this.validateAndNormalize(tenantId, {
        programId: target.programId,
        branchId: target.branchId,
        coachId: input.coachId !== undefined ? input.coachId : target.coachId,
        room: input.room !== undefined ? input.room : (target.room ?? undefined),
        date: toDateOnlyString(target.date),
        startTime:
          input.startTime ?? this.timeToHHmm(target.startTime),
        endTime: input.endTime ?? this.timeToHHmm(target.endTime),
        capacity: input.capacity ?? target.capacity,
      });
      await this.assertNoConflict(tenantId, validated, id);

      await this.prisma.classSession.update({
        where: { id },
        data: {
          coachId: validated.coachId,
          room: validated.room,
          startTime: validated.startTime,
          endTime: validated.endTime,
          capacity: validated.capacity,
          ...(input.status !== undefined && { status: input.status }),
        },
      });
    }

    return this.getSessionForTenant(tenantId, sessionId);
  }

  async cancelSession(tenantId: string, sessionId: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: sessionId, tenantId },
    });

    if (!session) {
      throw new NotFoundException('Class session not found.');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.classSession.update({
        where: { id: sessionId },
        data: { status: 'cancelled' },
      }),
      this.prisma.classBooking.updateMany({
        where: { classSessionId: sessionId, status: { in: ['booked', 'waitlisted'] } },
        data: { status: 'cancelled', cancelledAt: new Date() },
      }),
    ]);

    return this.serialize({ ...updated, _count: { bookings: 0 } });
  }

  private timeToHHmm(date: Date): string {
    return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
  }

  private async validateAndNormalize(tenantId: string, input: SessionInput) {
    if (
      !input.programId ||
      !input.branchId ||
      !input.date ||
      !input.startTime ||
      !input.endTime ||
      !input.capacity
    ) {
      throw new BadRequestException(
        'Program, branch, date, start time, end time, and capacity are required.',
      );
    }

    if (input.capacity < 1) {
      throw new BadRequestException('Capacity must be at least 1.');
    }

    const program = await this.prisma.trainingProgram.findFirst({
      where: { id: input.programId, tenantId },
    });
    if (!program) {
      throw new BadRequestException('Training program is invalid for this tenant.');
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: input.branchId, tenantId },
    });
    if (!branch) {
      throw new BadRequestException('Branch is invalid for this tenant.');
    }

    if (input.coachId) {
      const coach = await this.prisma.employee.findFirst({
        where: { id: input.coachId, tenantId },
      });
      if (!coach) {
        throw new BadRequestException('Coach is invalid for this tenant.');
      }
    }

    const startTime = combineDateAndTime(input.date, input.startTime);
    const endTime = combineDateAndTime(input.date, input.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time.');
    }

    return {
      programId: input.programId,
      branchId: input.branchId,
      coachId: input.coachId ?? null,
      room: input.room,
      date: new Date(`${input.date}T00:00:00.000Z`),
      startTime,
      endTime,
      capacity: input.capacity,
    };
  }

  /** Prevents the same coach or room being double-booked with an
   * overlapping time window (checked at session-creation time, not
   * booking time). */
  private async assertNoConflict(
    tenantId: string,
    validated: {
      branchId: string;
      coachId: string | null;
      room?: string;
      date: Date;
      startTime: Date;
      endTime: Date;
    },
    excludeSessionId?: string,
  ) {
    const overlapping = await this.prisma.classSession.findMany({
      where: {
        tenantId,
        date: validated.date,
        status: { not: 'cancelled' },
        ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
        startTime: { lt: validated.endTime },
        endTime: { gt: validated.startTime },
        OR: [
          ...(validated.coachId ? [{ coachId: validated.coachId }] : []),
          ...(validated.room
            ? [{ branchId: validated.branchId, room: validated.room }]
            : []),
        ],
      },
    });

    if (overlapping.length > 0) {
      throw new BadRequestException(
        'This time conflicts with an existing class for the same coach or room.',
      );
    }
  }

  private serialize(
    session: ClassSession & { _count?: { bookings: number } },
  ) {
    const { _count, ...rest } = session;
    return {
      ...rest,
      date: toDateOnlyString(session.date),
      bookedCount: _count?.bookings ?? 0,
    };
  }
}
