import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { addDays, localDateString, toDateOnlyString } from '../../common/date';
import { toNumber } from '../../common/decimal';
import { PrismaService } from '../../prisma/prisma.service';
import { ClassSessionsService } from '../class-sessions/class-sessions.service';
import { DebtService } from '../debt/debt.service';
import {
  ClassBookingStatus,
  Member,
  ProgramEnrollment,
  ProgramScheduleSlot,
  TrainingProgram,
} from '../../generated/prisma/client';

export type CreateTrainingProgramInput = {
  name?: string;
  branchId?: string | null;
  description?: string;
  color?: string;
  icon?: string;
  active?: boolean;
  maxMembers?: number;
  defaultCoachId?: string | null;
  price?: number;
  startDate?: string | null;
  endDate?: string | null;
};

export type UpdateTrainingProgramInput = CreateTrainingProgramInput;

export type ScheduleSlotInput = {
  dayOfWeek?: number;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
};

function timeStringToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

function timeToHHmm(date: Date): string {
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
}

@Injectable()
export class TrainingProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classSessionsService: ClassSessionsService,
    private readonly debtService: DebtService,
  ) {}

  async listProgramsForTenant(tenantId: string, branchId?: string) {
    const programs = await this.prisma.trainingProgram.findMany({
      where: {
        tenantId,
        // A branch-scoped request should see that branch's programs plus
        // every tenant-global (branchId = null) program.
        ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
      },
    });
    return programs.map((p) => this.serialize(p));
  }

  async getProgramForTenant(tenantId: string, programId: string) {
    const program = await this.getProgramRecord(tenantId, programId);
    return this.serialize(program);
  }

  private async getProgramRecord(
    tenantId: string,
    programId: string,
  ): Promise<TrainingProgram> {
    const program = await this.prisma.trainingProgram.findFirst({
      where: { id: programId, tenantId },
    });

    if (!program) {
      throw new NotFoundException('Training program not found.');
    }

    return program;
  }

  async createProgram(tenantId: string, input: CreateTrainingProgramInput) {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException('Training program name is required.');
    }

    if (input.branchId) {
      await this.assertBranchInTenant(tenantId, input.branchId);
    }

    if (input.defaultCoachId) {
      await this.assertEmployeeInTenant(tenantId, input.defaultCoachId);
    }

    const { price, startDate, endDate } = this.validateDates(
      input.price,
      input.startDate,
      input.endDate,
    );

    const program = await this.prisma.trainingProgram.create({
      data: {
        id: `program-${randomUUID()}`,
        tenantId,
        name,
        branchId: input.branchId ?? null,
        description: input.description,
        color: input.color,
        icon: input.icon,
        active: input.active ?? true,
        maxMembers: input.maxMembers,
        defaultCoachId: input.defaultCoachId ?? null,
        price: price ?? 0,
        startDate,
        endDate,
      },
    });

    return this.serialize(program);
  }

  async updateProgram(
    tenantId: string,
    programId: string,
    input: UpdateTrainingProgramInput,
  ) {
    const current = await this.getProgramRecord(tenantId, programId);

    const name = input.name === undefined ? current.name : input.name.trim();

    if (!name) {
      throw new BadRequestException('Training program name is required.');
    }

    if (input.branchId) {
      await this.assertBranchInTenant(tenantId, input.branchId);
    }

    if (input.defaultCoachId) {
      await this.assertEmployeeInTenant(tenantId, input.defaultCoachId);
    }

    const { price, startDate, endDate } = this.validateDates(
      input.price ?? toNumber(current.price),
      input.startDate === undefined
        ? toDateOnlyString(current.startDate)
        : input.startDate,
      input.endDate === undefined
        ? toDateOnlyString(current.endDate)
        : input.endDate,
    );

    const program = await this.prisma.trainingProgram.update({
      where: { id: programId },
      data: {
        name,
        ...(input.branchId !== undefined && { branchId: input.branchId }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.active !== undefined && { active: input.active }),
        ...(input.maxMembers !== undefined && {
          maxMembers: input.maxMembers,
        }),
        ...(input.defaultCoachId !== undefined && {
          defaultCoachId: input.defaultCoachId,
        }),
        price: price ?? 0,
        startDate,
        endDate,
      },
    });

    return this.serialize(program);
  }

  private validateDates(
    price: number | null | undefined,
    startDate: string | null | undefined,
    endDate: string | null | undefined,
  ): { price: number | null | undefined; startDate: Date | null; endDate: Date | null } {
    if (price !== undefined && price !== null && price < 0) {
      throw new BadRequestException('Price cannot be negative.');
    }

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException('End date must be on or after the start date.');
    }

    return {
      price,
      startDate: startDate ? new Date(`${startDate}T00:00:00.000Z`) : null,
      endDate: endDate ? new Date(`${endDate}T00:00:00.000Z`) : null,
    };
  }

  /** Programs a given membership plan may book: all of them when the plan
   * allows everything, otherwise only the ones explicitly entitled. Kept
   * for the membership-plan "included programs" picker UI — no longer
   * consulted when booking a class (see ClassBookingsService.bookClass),
   * since courses are priced and registered independently of membership. */
  async listEntitledProgramIds(planId: string): Promise<string[] | 'all'> {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
      select: { allowAllPrograms: true },
    });

    if (!plan || plan.allowAllPrograms) {
      return 'all';
    }

    const links = await this.prisma.membershipPlanProgram.findMany({
      where: { planId },
      select: { programId: true },
    });
    return links.map((l) => l.programId);
  }

  async setEntitledPrograms(
    tenantId: string,
    planId: string,
    programIds: string[],
  ) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, tenantId },
    });

    if (!plan) {
      throw new NotFoundException('Membership plan not found.');
    }

    const programs = await this.prisma.trainingProgram.findMany({
      where: { id: { in: programIds }, tenantId },
      select: { id: true },
    });

    if (programs.length !== new Set(programIds).size) {
      throw new BadRequestException(
        'One or more training programs are invalid for this tenant.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.membershipPlanProgram.deleteMany({ where: { planId } }),
      this.prisma.membershipPlanProgram.createMany({
        data: programIds.map((programId) => ({ planId, programId })),
      }),
    ]);

    return this.listEntitledProgramIds(planId);
  }

  // ── Weekly schedule ────────────────────────────────────────────────────

  async getScheduleSlots(tenantId: string, programId: string) {
    await this.getProgramRecord(tenantId, programId);
    const slots = await this.prisma.programScheduleSlot.findMany({
      where: { programId },
      orderBy: [{ dayOfWeek: 'asc' }],
    });
    return slots.map((s) => this.serializeSlot(s));
  }

  async setScheduleSlots(
    tenantId: string,
    programId: string,
    slots: ScheduleSlotInput[],
  ) {
    await this.getProgramRecord(tenantId, programId);

    const normalized = slots.map((slot) => {
      if (
        slot.dayOfWeek === undefined ||
        slot.dayOfWeek < 0 ||
        slot.dayOfWeek > 6
      ) {
        throw new BadRequestException(
          'Each schedule slot needs a day of week (0-6).',
        );
      }
      if (!slot.startTime || !slot.endTime) {
        throw new BadRequestException(
          'Each schedule slot needs a start and end time.',
        );
      }

      const startTime = timeStringToDate(slot.startTime);
      const endTime = timeStringToDate(slot.endTime);

      if (endTime <= startTime) {
        throw new BadRequestException(
          'A schedule slot end time must be after its start time.',
        );
      }

      return { dayOfWeek: slot.dayOfWeek, startTime, endTime };
    });

    await this.prisma.$transaction([
      this.prisma.programScheduleSlot.deleteMany({ where: { programId } }),
      ...(normalized.length > 0
        ? [
            this.prisma.programScheduleSlot.createMany({
              data: normalized.map((slot) => ({
                id: `slot-${randomUUID()}`,
                programId,
                ...slot,
              })),
            }),
          ]
        : []),
    ]);

    return this.getScheduleSlots(tenantId, programId);
  }

  /** Expands a course's weekly schedule slots into concrete ClassSessions
   * across its startDate..endDate, reusing ClassSessionsService.createSession
   * for validation/conflict-checking rather than duplicating it. Idempotent:
   * re-running after editing the schedule skips date/time combinations that
   * already have a session. */
  async generateSessions(
    tenantId: string,
    programId: string,
    input: { branchId?: string } = {},
  ) {
    const program = await this.getProgramRecord(tenantId, programId);
    const scheduleSlots = await this.prisma.programScheduleSlot.findMany({
      where: { programId },
    });

    if (!program.startDate || !program.endDate) {
      throw new BadRequestException(
        'The course needs a start and end date before sessions can be generated.',
      );
    }
    if (scheduleSlots.length === 0) {
      throw new BadRequestException(
        'Add at least one weekly schedule slot before generating sessions.',
      );
    }

    const branchId = input.branchId ?? program.branchId;
    if (!branchId) {
      throw new BadRequestException(
        'A branch is required to generate sessions for a tenant-wide course.',
      );
    }
    await this.assertBranchInTenant(tenantId, branchId);

    const existing = await this.prisma.classSession.findMany({
      where: { tenantId, programId },
      select: { date: true, startTime: true },
    });
    const existingKeys = new Set(
      existing.map((s) => `${toDateOnlyString(s.date)}|${timeToHHmm(s.startTime)}`),
    );

    const capacity = program.maxMembers ?? 20;
    const created: unknown[] = [];
    const skipped: { date: string; reason: string }[] = [];

    const endStr = toDateOnlyString(program.endDate);
    let cursor = toDateOnlyString(program.startDate);

    while (cursor <= endStr) {
      const dayOfWeek = new Date(`${cursor}T00:00:00.000Z`).getUTCDay();
      const slotsForDay = scheduleSlots.filter((s) => s.dayOfWeek === dayOfWeek);

      for (const slot of slotsForDay) {
        const startTime = timeToHHmm(slot.startTime);
        const endTime = timeToHHmm(slot.endTime);
        const key = `${cursor}|${startTime}`;

        if (existingKeys.has(key)) continue;

        try {
          const session = await this.classSessionsService.createSession(tenantId, {
            programId,
            branchId,
            coachId: program.defaultCoachId,
            date: cursor,
            startTime,
            endTime,
            capacity,
          });
          created.push(session);
          existingKeys.add(key);
        } catch (error) {
          skipped.push({ date: cursor, reason: (error as Error).message });
        }
      }

      cursor = addDays(cursor, 1);
    }

    return { created, skipped };
  }

  // ── Registration (any member, priced independently of membership) ──────

  async listEnrollments(tenantId: string, programId: string) {
    await this.getProgramRecord(tenantId, programId);
    const enrollments = await this.prisma.programEnrollment.findMany({
      where: { programId },
      include: { member: true },
      orderBy: { enrolledAt: 'asc' },
    });
    return enrollments.map((e) => this.serializeEnrollment(e, e.member));
  }

  async listEnrollmentsForMember(tenantId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const enrollments = await this.prisma.programEnrollment.findMany({
      where: { memberId },
      include: { program: true },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((e) => ({
      memberId: e.memberId,
      programId: e.programId,
      enrolledAt: e.enrolledAt,
      finalPrice: toNumber(e.finalPrice),
      status: e.status,
      program: this.serialize(e.program),
    }));
  }

  /** Historical alias used by the membership-plan "included programs"
   * picker's neighbour UI — returns just the active member ids. */
  async listEnrolledMemberIds(
    tenantId: string,
    programId: string,
  ): Promise<string[]> {
    await this.getProgramRecord(tenantId, programId);
    const links = await this.prisma.programEnrollment.findMany({
      where: { programId, status: 'active' },
      select: { memberId: true },
    });
    return links.map((l) => l.memberId);
  }

  async registerMember(tenantId: string, programId: string, memberId: string) {
    const program = await this.getProgramRecord(tenantId, programId);

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) {
      throw new BadRequestException('Member is invalid for this tenant.');
    }

    const existing = await this.prisma.programEnrollment.findUnique({
      where: { programId_memberId: { programId, memberId } },
    });
    if (existing?.status === 'active') {
      throw new BadRequestException(
        'Member is already registered for this course.',
      );
    }

    if (program.maxMembers) {
      const activeCount = await this.prisma.programEnrollment.count({
        where: { programId, status: 'active' },
      });
      if (activeCount >= program.maxMembers) {
        throw new BadRequestException('This course is full.');
      }
    }

    const finalPrice = program.price;

    const enrollment = await this.prisma.$transaction(async (tx) => {
      const enr = await tx.programEnrollment.upsert({
        where: { programId_memberId: { programId, memberId } },
        create: { programId, memberId, finalPrice, status: 'active' },
        update: { finalPrice, status: 'active', enrolledAt: new Date() },
      });

      const today = new Date(`${localDateString()}T00:00:00.000Z`);
      const sessions = await tx.classSession.findMany({
        where: { programId, status: 'scheduled', date: { gte: today } },
      });

      for (const session of sessions) {
        const alreadyBooked = await tx.classBooking.findUnique({
          where: {
            classSessionId_memberId: {
              classSessionId: session.id,
              memberId,
            },
          },
        });
        if (alreadyBooked) continue;

        const bookedCount = await tx.classBooking.count({
          where: { classSessionId: session.id, status: 'booked' },
        });
        const status = bookedCount < session.capacity ? 'booked' : 'waitlisted';

        await tx.classBooking.create({
          data: {
            id: `booking-${randomUUID()}`,
            classSessionId: session.id,
            memberId,
            status,
          },
        });
      }

      return enr;
    });

    await this.debtService.recompute(memberId);

    return this.serializeEnrollment(enrollment, member);
  }

  async unregisterMember(tenantId: string, programId: string, memberId: string) {
    await this.getProgramRecord(tenantId, programId);

    const enrollment = await this.prisma.programEnrollment.findUnique({
      where: { programId_memberId: { programId, memberId } },
    });
    if (!enrollment || enrollment.status === 'cancelled') {
      throw new NotFoundException('Member is not registered for this course.');
    }

    await this.prisma.$transaction([
      this.prisma.programEnrollment.update({
        where: { programId_memberId: { programId, memberId } },
        data: { status: 'cancelled' },
      }),
      this.prisma.classBooking.updateMany({
        where: {
          memberId,
          status: { in: ['booked', 'waitlisted'] },
          classSession: { programId },
        },
        data: { status: 'cancelled', cancelledAt: new Date() },
      }),
    ]);

    await this.debtService.recompute(memberId);
  }

  // ── Attendance report ────────────────────────────────────────────────────

  async getAttendanceReport(tenantId: string, programId: string) {
    const program = await this.getProgramRecord(tenantId, programId);

    const sessions = await this.prisma.classSession.findMany({
      where: { programId, status: { not: 'cancelled' } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    const enrollments = await this.prisma.programEnrollment.findMany({
      where: { programId },
      include: { member: true },
      orderBy: { enrolledAt: 'asc' },
    });

    const bookings =
      sessions.length > 0
        ? await this.prisma.classBooking.findMany({
            where: { classSessionId: { in: sessions.map((s) => s.id) } },
          })
        : [];

    const bookingByMemberAndSession = new Map<string, ClassBookingStatus>();
    for (const b of bookings) {
      bookingByMemberAndSession.set(`${b.memberId}|${b.classSessionId}`, b.status);
    }

    const students = enrollments.map((enrollment) => {
      const lessons = sessions.map((session) => ({
        sessionId: session.id,
        date: toDateOnlyString(session.date),
        status:
          bookingByMemberAndSession.get(`${enrollment.memberId}|${session.id}`) ??
          null,
      }));

      const attended = lessons.filter((l) => l.status === 'attended').length;
      const absent = lessons.filter((l) => l.status === 'noShow').length;
      const pending = lessons.filter((l) => l.status === 'booked').length;

      return {
        memberId: enrollment.memberId,
        fullName: enrollment.member.fullName,
        memberNumber: enrollment.member.memberNumber,
        finalPrice: toNumber(enrollment.finalPrice),
        enrollmentStatus: enrollment.status,
        lessons,
        totals: { totalLessons: sessions.length, attended, absent, pending },
      };
    });

    return {
      program: this.serialize(program),
      sessions: sessions.map((s) => ({
        id: s.id,
        date: toDateOnlyString(s.date),
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      students,
    };
  }

  private async assertBranchInTenant(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });
    if (!branch) {
      throw new BadRequestException('Branch is invalid for this tenant.');
    }
  }

  private async assertEmployeeInTenant(tenantId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) {
      throw new BadRequestException('Coach is invalid for this tenant.');
    }
  }

  private serialize(program: TrainingProgram) {
    return {
      ...program,
      price: toNumber(program.price),
      startDate: toDateOnlyString(program.startDate),
      endDate: toDateOnlyString(program.endDate),
    };
  }

  private serializeSlot(slot: ProgramScheduleSlot) {
    return {
      id: slot.id,
      programId: slot.programId,
      dayOfWeek: slot.dayOfWeek,
      startTime: timeToHHmm(slot.startTime),
      endTime: timeToHHmm(slot.endTime),
    };
  }

  private serializeEnrollment(
    enrollment: ProgramEnrollment,
    member: Member,
  ) {
    return {
      memberId: enrollment.memberId,
      programId: enrollment.programId,
      enrolledAt: enrollment.enrolledAt,
      finalPrice: toNumber(enrollment.finalPrice),
      status: enrollment.status,
      member: {
        id: member.id,
        fullName: member.fullName,
        memberNumber: member.memberNumber,
      },
    };
  }
}
