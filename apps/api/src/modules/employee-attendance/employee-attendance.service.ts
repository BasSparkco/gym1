import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as QRCode from 'qrcode';
import { localDateString, toDateOnlyString } from '../../common/date';
import { employeeIdToUuid, generateQrSig } from '../../common/qr';
import { BasIpSyncService } from '../access/bas-ip-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessMethod, Employee } from '../../generated/prisma/client';

type CheckInInput = {
  employeeIdentifier?: string;
  accessMethod?: AccessMethod;
};

type CheckInResult =
  | { granted: false; reason: string }
  | {
      granted: true;
      employee: { id: string; fullName: string; employeeNumber: string };
      visit: unknown;
    };

// Same "today" convention as VisitsService/AccessService — a UTC-day range
// rather than a local-time one, ported for consistency with the member
// check-in flow this mirrors.
function todayUtcRange(): { gte: Date; lt: Date } {
  const gte = new Date(`${localDateString()}T00:00:00.000Z`);
  const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
  return { gte, lt };
}

@Injectable()
export class EmployeeAttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly basIpSyncService: BasIpSyncService,
  ) {}

  async checkIn(
    tenantId: string,
    branchId: string,
    input: CheckInInput,
  ): Promise<CheckInResult> {
    const identifier = input.employeeIdentifier?.trim();
    if (!identifier) {
      return { granted: false, reason: 'Employee identifier is required.' };
    }

    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId,
        status: 'active',
        OR: [{ employeeNumber: identifier }, { id: identifier }],
      },
    });
    if (!employee) {
      return { granted: false, reason: 'Employee not found.' };
    }

    const alreadyCheckedIn = await this.prisma.employeeVisit.findFirst({
      where: {
        employeeId: employee.id,
        branchId,
        checkOutTime: null,
        checkInTime: todayUtcRange(),
      },
    });
    if (alreadyCheckedIn) {
      return { granted: false, reason: 'Employee is already checked in.' };
    }

    const visit = await this.prisma.employeeVisit.create({
      data: {
        id: `employee-visit-${randomUUID()}`,
        employeeId: employee.id,
        branchId,
        checkInTime: new Date(),
        checkOutTime: null,
        accessMethod: input.accessMethod ?? 'manual',
      },
    });

    return {
      granted: true,
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        employeeNumber: employee.employeeNumber,
      },
      visit,
    };
  }

  async checkOut(tenantId: string, branchId: string, visitId: string) {
    const visit = await this.prisma.employeeVisit.findFirst({
      where: { id: visitId, branchId, employee: { tenantId } },
    });
    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }
    if (visit.checkOutTime !== null) {
      throw new BadRequestException('Visit already checked out.');
    }

    return this.prisma.employeeVisit.update({
      where: { id: visitId },
      data: { checkOutTime: new Date() },
    });
  }

  async listVisitsForScope(tenantId: string, branchId: string | undefined) {
    return this.prisma.employeeVisit.findMany({
      where: { employee: { tenantId }, ...(branchId ? { branchId } : {}) },
      orderBy: { checkInTime: 'desc' },
    });
  }

  async listVisitsForEmployee(
    tenantId: string,
    employeeId: string,
    limit = 10,
  ) {
    await this.getEmployeeRecord(tenantId, employeeId);
    return this.prisma.employeeVisit.findMany({
      where: { employeeId },
      orderBy: { checkInTime: 'desc' },
      take: limit,
    });
  }

  // ── QR code ───────────────────────────────────────────────────────────

  async getEmployeeQrCodeBuffer(
    tenantId: string,
    employeeId: string,
  ): Promise<Buffer> {
    const employee = await this.getEmployeeRecord(tenantId, employeeId);
    return this.generateQrBuffer(employee.id);
  }

  async getEmployeeQrCodeBufferById(employeeId: string): Promise<Buffer> {
    return this.generateQrBuffer(employeeId);
  }

  verifyQrSig(employeeId: string, sig: string): boolean {
    return generateQrSig(employeeId) === sig;
  }

  private async generateQrBuffer(employeeId: string): Promise<Buffer> {
    // Generate locally, same as MembersService.generateQrBuffer — the
    // device PNG isn't special, it's the same UUID content either way.
    const uuid = employeeIdToUuid(employeeId);
    return QRCode.toBuffer(uuid, { type: 'png', width: 400, margin: 2 });
  }

  // ── Gate access ──────────────────────────────────────────────────────

  async getEmployeeGates(tenantId: string, employeeId: string) {
    const employee = await this.getEmployeeRecord(tenantId, employeeId);
    if (employee.allowAllGates) {
      return { allowAllGates: true, gateIds: [] as string[] };
    }
    const links = await this.prisma.employeeGate.findMany({
      where: { employeeId },
      select: { gateId: true },
    });
    return { allowAllGates: false, gateIds: links.map((l) => l.gateId) };
  }

  async setEmployeeGates(
    tenantId: string,
    employeeId: string,
    input: { allowAllGates: boolean; gateIds: string[] },
  ) {
    const employee = await this.getEmployeeRecord(tenantId, employeeId);

    if (!input.allowAllGates) {
      const gates = await this.prisma.gate.findMany({
        where: { id: { in: input.gateIds }, tenantId },
        select: { id: true },
      });
      if (gates.length !== new Set(input.gateIds).size) {
        throw new BadRequestException(
          'One or more gates are invalid for this tenant.',
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.employee.update({
        where: { id: employeeId },
        data: { allowAllGates: input.allowAllGates },
      }),
      this.prisma.employeeGate.deleteMany({ where: { employeeId } }),
      ...(input.allowAllGates
        ? []
        : [
            this.prisma.employeeGate.createMany({
              data: input.gateIds.map((gateId) => ({ employeeId, gateId })),
            }),
          ]),
    ]);

    // Best-effort — same fire-and-forget pattern as member QR sync
    // (MembershipsService.syncToDevice). Real-time gate validation via
    // AccessService.checkAccess is authoritative regardless of this push.
    void this.basIpSyncService.pushEmployeeQrIdentifier(
      employee.id,
      employee.fullName,
    );

    return this.getEmployeeGates(tenantId, employeeId);
  }

  // ── Attendance report ────────────────────────────────────────────────

  async getAttendanceReport(
    tenantId: string,
    branchId: string | undefined,
    dateFrom: string,
    dateTo: string,
  ) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, status: 'active', ...(branchId ? { branchId } : {}) },
      orderBy: { fullName: 'asc' },
    });

    const from = new Date(`${dateFrom}T00:00:00.000Z`);
    const to = new Date(`${dateTo}T23:59:59.999Z`);

    const visits =
      employees.length > 0
        ? await this.prisma.employeeVisit.findMany({
            where: {
              employeeId: { in: employees.map((e) => e.id) },
              checkInTime: { gte: from, lte: to },
            },
            orderBy: { checkInTime: 'asc' },
          })
        : [];

    const visitsByEmployee = new Map<string, typeof visits>();
    for (const visit of visits) {
      const list = visitsByEmployee.get(visit.employeeId) ?? [];
      list.push(visit);
      visitsByEmployee.set(visit.employeeId, list);
    }

    const report = employees.map((employee) => {
      const employeeVisits = visitsByEmployee.get(employee.id) ?? [];

      // Group same-day visits together (an employee could check in/out more
      // than once in a day) — a day's row shows the first check-in, the
      // last check-out, and the summed hours across every session that day.
      const byDate = new Map<
        string,
        { checkInTime: Date; checkOutTime: Date | null; hoursWorked: number }[]
      >();
      for (const visit of employeeVisits) {
        const date = toDateOnlyString(visit.checkInTime);
        const hoursWorked = visit.checkOutTime
          ? (visit.checkOutTime.getTime() - visit.checkInTime.getTime()) /
            3_600_000
          : 0;
        const entries = byDate.get(date) ?? [];
        entries.push({
          checkInTime: visit.checkInTime,
          checkOutTime: visit.checkOutTime,
          hoursWorked,
        });
        byDate.set(date, entries);
      }

      const days = Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, entries]) => ({
          date,
          checkInTime: entries[0].checkInTime.toISOString(),
          checkOutTime:
            entries[entries.length - 1].checkOutTime?.toISOString() ?? null,
          hoursWorked:
            Math.round(
              entries.reduce((sum, e) => sum + e.hoursWorked, 0) * 100,
            ) / 100,
        }));

      const totalHours =
        Math.round(days.reduce((sum, d) => sum + d.hoursWorked, 0) * 100) /
        100;

      return {
        employeeId: employee.id,
        fullName: employee.fullName,
        employeeNumber: employee.employeeNumber,
        days,
        totals: { daysPresent: days.length, totalHours },
      };
    });

    return { dateFrom, dateTo, employees: report };
  }

  private async getEmployeeRecord(
    tenantId: string,
    employeeId: string,
  ): Promise<Employee> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }
    return employee;
  }
}
