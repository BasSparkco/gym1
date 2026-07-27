import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { localDateString } from '../../common/date';
import { employeeIdToUuid, memberIdToUuid } from '../../common/qr';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessMethod, Employee, Member } from '../../generated/prisma/client';

export type AccessResult =
  | { granted: false; reason: string }
  | {
      granted: true;
      member: { id: string; fullName: string; memberNumber: string };
      visit: unknown;
    }
  | {
      granted: true;
      employee: { id: string; fullName: string; employeeNumber: string };
      visit: unknown;
    };

// Matches the original's `checkInTime.startsWith(localDateString())` string
// check exactly — a pre-existing quirk mixing local "today" with a UTC
// timestamp string; ported as-is rather than fixed here.
function todayUtcRange(): { gte: Date; lt: Date } {
  const gte = new Date(`${localDateString()}T00:00:00.000Z`);
  const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
  return { gte, lt };
}

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates access for a presented identifier and logs a visit on success.
   * Tries a Member first (the common case), then an Employee — the two
   * share the same UUID-derived identifier space with no realistic
   * collision, so a single device/gate can serve both without the device
   * needing to know which kind of person it just scanned.
   *
   * @param identifierNumber - the raw identifier from the device (RFID tag, QR payload, or input code)
   * @param identifierType   - how the identifier was read: 'card' | 'qr' | 'input_code'
   * @param branchId         - which branch the device is installed at
   * @param gateId           - which gate the request came from (optional); used to enforce gender/gate restrictions
   */
  async checkAccess(
    identifierNumber: string,
    identifierType: 'card' | 'qr' | 'input_code',
    branchId: string,
    gateId?: string,
  ): Promise<AccessResult> {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId },
    });
    if (!branch) {
      return { granted: false, reason: 'Unknown branch.' };
    }

    const accessMethod: AccessMethod = identifierType === 'card' ? 'rfid' : 'qr';

    const member = await this.resolveMember(
      branch.tenantId,
      identifierNumber,
      identifierType,
    );
    if (member) {
      return this.checkMemberAccess(
        member,
        branch.tenantId,
        branchId,
        accessMethod,
        gateId,
      );
    }

    const employee = await this.resolveEmployee(
      branch.tenantId,
      identifierNumber,
      identifierType,
    );
    if (employee) {
      return this.checkEmployeeAccess(
        employee,
        branch.tenantId,
        branchId,
        accessMethod,
        gateId,
      );
    }

    return { granted: false, reason: 'Unknown card.' };
  }

  private async checkMemberAccess(
    member: Member,
    tenantId: string,
    branchId: string,
    accessMethod: AccessMethod,
    gateId?: string,
  ): Promise<AccessResult> {
    const today = new Date(localDateString());

    const membership = await this.prisma.membership.findFirst({
      where: {
        memberId: member.id,
        status: 'active',
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });
    if (!membership) {
      return { granted: false, reason: 'No active membership.' };
    }

    // Gate-level gender restriction check
    if (gateId) {
      const gate = await this.prisma.gate.findFirst({
        where: { id: gateId, tenantId },
      });
      if (gate && gate.genderRestriction && gate.genderRestriction !== member.sex) {
        const genderLabel = gate.genderRestriction === 'male' ? "men's" : "women's";
        return {
          granted: false,
          reason: `This gate is for ${genderLabel} only.`,
        };
      }
    }

    const alreadyCheckedIn = await this.prisma.visit.findFirst({
      where: {
        memberId: member.id,
        branchId,
        checkOutTime: null,
        checkInTime: todayUtcRange(),
      },
    });
    if (alreadyCheckedIn) {
      return { granted: false, reason: 'Member is already checked in.' };
    }

    const visit = await this.prisma.visit.create({
      data: {
        id: `visit-${randomUUID()}`,
        memberId: member.id,
        branchId,
        checkInTime: new Date(),
        checkOutTime: null,
        accessMethod,
        gateId,
      },
    });

    return {
      granted: true,
      member: {
        id: member.id,
        fullName: member.fullName,
        memberNumber: member.memberNumber,
      },
      visit,
    };
  }

  private async checkEmployeeAccess(
    employee: Employee,
    tenantId: string,
    branchId: string,
    accessMethod: AccessMethod,
    gateId?: string,
  ): Promise<AccessResult> {
    // Gate allow-list check — mirrors the member gender-restriction check
    // above, but employees are opt-out (allowAllGates default true) rather
    // than gender-based.
    if (gateId && !employee.allowAllGates) {
      const allowed = await this.prisma.employeeGate.findFirst({
        where: { employeeId: employee.id, gateId, gate: { tenantId } },
      });
      if (!allowed) {
        return {
          granted: false,
          reason: 'This employee is not permitted at this gate.',
        };
      }
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
        accessMethod,
        gateId,
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

  private async resolveMember(
    tenantId: string,
    identifierNumber: string,
    identifierType: 'card' | 'qr' | 'input_code',
  ): Promise<Member | null> {
    if (identifierType === 'card') {
      const tag = identifierNumber.toUpperCase().replace(/[:\-]/g, '');
      return this.prisma.member.findFirst({ where: { tenantId, rfidTag: tag } });
    }

    // qr and input_code: identifier_number is the UUID pushed to the BAS-IP
    // device. memberIdToUuid() is a computed transform of the id (not a
    // stored column), so this can't be pushed into a single indexed WHERE —
    // fetch the tenant's members and match in memory, same as the original.
    const tenantMembers = await this.prisma.member.findMany({
      where: { tenantId },
    });

    return (
      tenantMembers.find(
        (m) =>
          memberIdToUuid(m.id) === identifierNumber ||
          m.id === identifierNumber ||
          m.memberNumber === identifierNumber,
      ) ?? null
    );
  }

  /**
   * Employees have no rfidTag field (QR-only for now, per the original
   * ask), so unlike resolveMember there's no 'card' branch here — a 'card'
   * identifier simply won't resolve to an employee.
   */
  private async resolveEmployee(
    tenantId: string,
    identifierNumber: string,
    identifierType: 'card' | 'qr' | 'input_code',
  ): Promise<Employee | null> {
    if (identifierType === 'card') {
      return null;
    }

    const tenantEmployees = await this.prisma.employee.findMany({
      where: { tenantId, status: 'active' },
    });

    return (
      tenantEmployees.find(
        (e) =>
          employeeIdToUuid(e.id) === identifierNumber ||
          e.id === identifierNumber ||
          e.employeeNumber === identifierNumber,
      ) ?? null
    );
  }
}
