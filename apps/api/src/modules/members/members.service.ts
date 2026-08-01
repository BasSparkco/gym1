import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as QRCode from 'qrcode';
import { localDateString, toDateOnlyString } from '../../common/date';
import { generateQrSig, makeQrPublicUrl, memberIdToUuid } from '../../common/qr';
import { localPartDigits, normalizePhone } from '../../common/phone';
import { hashPin, pinMatches } from '../../common/pin-hash';
import { toNumber } from '../../common/decimal';
import { findCountryByCode } from '../../data/countries';
import { BasIpSyncService } from '../access/bas-ip-sync.service';
import { DebtService } from '../debt/debt.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Branch, Member, Sex } from '../../generated/prisma/client';

type CreateMemberInput = {
  fullName?: string;
  homeBranchId?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  sex?: Sex;
  idNumber?: string;
  address?: string;
  height?: number;
  weight?: number;
  registeredEmployeeId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  rfidTag?: string;
};

type UpdateMemberInput = {
  fullName?: string;
  homeBranchId?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  sex?: Sex;
  idNumber?: string;
  address?: string;
  height?: number;
  weight?: number;
  registeredEmployeeId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  rfidTag?: string;
};

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly basIpSyncService: BasIpSyncService,
    private readonly debtService: DebtService,
  ) {}

  getReportingDate() {
    return localDateString();
  }

  async listMembersForScope(tenantId: string, branchId: string) {
    const members = await this.prisma.member.findMany({
      where: { tenantId, homeBranchId: branchId },
    });
    const activeIds = await this.buildActiveSet(tenantId);
    return members.map((m) => this.withComputedStatus(m, activeIds));
  }

  async listMembersForTenant(tenantId: string) {
    const members = await this.prisma.member.findMany({ where: { tenantId } });
    const activeIds = await this.buildActiveSet(tenantId);
    return members.map((m) => this.withComputedStatus(m, activeIds));
  }

  async getMemberForScope(
    tenantId: string,
    branchId: string | undefined,
    memberId: string,
  ) {
    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        tenantId,
        ...(branchId ? { homeBranchId: branchId } : {}),
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const activeIds = await this.buildActiveSet(tenantId);
    return this.withComputedStatus(member, activeIds);
  }

  async createMember(
    tenantId: string,
    branchId: string,
    input: CreateMemberInput,
  ) {
    const fullName = input.fullName?.trim();

    if (!fullName) {
      throw new BadRequestException('Full name is required.');
    }

    const homeBranchId = input.homeBranchId ?? branchId;
    const branch = await this.ensureBranchBelongsToTenant(
      tenantId,
      homeBranchId,
    );

    const registeredEmployeeId = input.registeredEmployeeId?.trim() || undefined;
    if (registeredEmployeeId) {
      await this.ensureEmployeeBelongsToTenant(tenantId, registeredEmployeeId);
    }

    const dialCode = this.getDialCodeForBranch(branch);
    const memberNumber = await this.getNextMemberNumber(tenantId);

    const member = await this.prisma.member.create({
      data: {
        id: `member-${randomUUID()}`,
        tenantId,
        homeBranchId,
        memberNumber,
        fullName,
        joinDate: new Date(localDateString()),
        phone: normalizePhone(input.phone, dialCode),
        email: input.email?.trim().toLowerCase() || undefined,
        dateOfBirth: input.dateOfBirth?.trim()
          ? new Date(input.dateOfBirth.trim())
          : undefined,
        sex: input.sex || undefined,
        idNumber: input.idNumber?.trim() || undefined,
        address: input.address?.trim() || undefined,
        height: input.height ? Number(input.height) : undefined,
        weight: input.weight ? Number(input.weight) : undefined,
        registeredEmployeeId,
        emergencyContactName: input.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: normalizePhone(
          input.emergencyContactPhone,
          dialCode,
        ),
        medicalNotes: input.medicalNotes?.trim() || undefined,
        rfidTag: input.rfidTag?.trim().toUpperCase() || undefined,
      },
    });

    // A brand-new member can't have an existing active membership yet.
    return { ...this.serializeMember(member), status: 'inactive' as const };
  }

  async updateMember(
    tenantId: string,
    branchId: string | undefined,
    memberId: string,
    input: UpdateMemberInput,
  ) {
    const current = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        tenantId,
        ...(branchId ? { homeBranchId: branchId } : {}),
      },
    });

    if (!current) {
      throw new NotFoundException('Member not found.');
    }

    const nextFullName =
      input.fullName === undefined
        ? current.fullName
        : this.normalizeMemberName(input.fullName);
    const nextHomeBranchId = input.homeBranchId ?? current.homeBranchId;

    const branch = await this.ensureBranchBelongsToTenant(
      tenantId,
      nextHomeBranchId,
    );

    const nextRegisteredEmployeeId =
      input.registeredEmployeeId === undefined
        ? undefined
        : input.registeredEmployeeId.trim() || null;
    if (nextRegisteredEmployeeId) {
      await this.ensureEmployeeBelongsToTenant(
        tenantId,
        nextRegisteredEmployeeId,
      );
    }

    const dialCode = this.getDialCodeForBranch(branch);

    const updated = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        fullName: nextFullName,
        homeBranchId: nextHomeBranchId,
        phone:
          input.phone === undefined
            ? undefined
            : normalizePhone(input.phone, dialCode) ?? null,
        email:
          input.email === undefined
            ? undefined
            : input.email.trim().toLowerCase() || null,
        dateOfBirth:
          input.dateOfBirth === undefined
            ? undefined
            : input.dateOfBirth.trim()
              ? new Date(input.dateOfBirth.trim())
              : null,
        sex: input.sex === undefined ? undefined : input.sex || null,
        idNumber:
          input.idNumber === undefined
            ? undefined
            : input.idNumber.trim() || null,
        address:
          input.address === undefined
            ? undefined
            : input.address.trim() || null,
        height:
          input.height === undefined
            ? undefined
            : input.height
              ? Number(input.height)
              : null,
        weight:
          input.weight === undefined
            ? undefined
            : input.weight
              ? Number(input.weight)
              : null,
        registeredEmployeeId: nextRegisteredEmployeeId,
        emergencyContactName:
          input.emergencyContactName === undefined
            ? undefined
            : input.emergencyContactName.trim() || null,
        emergencyContactPhone:
          input.emergencyContactPhone === undefined
            ? undefined
            : normalizePhone(input.emergencyContactPhone, dialCode) ?? null,
        medicalNotes:
          input.medicalNotes === undefined
            ? undefined
            : input.medicalNotes.trim() || null,
        rfidTag:
          input.rfidTag === undefined
            ? undefined
            : input.rfidTag.trim().toUpperCase() || null,
      },
    });

    const activeIds = await this.buildActiveSet(tenantId);
    return this.withComputedStatus(updated, activeIds);
  }

  async updateMemberPicture(
    tenantId: string,
    branchId: string | undefined,
    memberId: string,
    pictureUrl: string,
  ) {
    const current = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        tenantId,
        ...(branchId ? { homeBranchId: branchId } : {}),
      },
    });

    if (!current) {
      throw new NotFoundException('Member not found.');
    }

    const updated = await this.prisma.member.update({
      where: { id: memberId },
      data: { pictureUrl },
    });

    return this.serializeMember(updated);
  }

  /**
   * Staff-triggered: assigns or resets the PIN a member uses to sign into
   * the mobile app. There's no member self-service flow yet — a staff
   * member hands the PIN to them directly (e.g. at the front desk).
   */
  async setMemberAppPin(
    tenantId: string,
    branchId: string | undefined,
    memberId: string,
    pin: string,
  ): Promise<void> {
    if (!/^\d{4,8}$/.test(pin)) {
      throw new BadRequestException('PIN must be 4 to 8 digits.');
    }

    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        tenantId,
        ...(branchId ? { homeBranchId: branchId } : {}),
      },
      include: { homeBranch: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    if (!member.phone) {
      throw new BadRequestException(
        'This member has no phone number on file. The app signs in by phone, so add one first.',
      );
    }

    // The app signs in by phone (international or local form) and
    // disambiguates by PIN, so the same identifier + PIN pair must be unique
    // across ALL tenants (one person can be a member of two gyms with the
    // same phone — different PINs keep the accounts distinguishable at
    // sign-in). Matching on the local digits too is deliberately broader
    // than exact phone equality: two numbers that only differ in country
    // code collide on the local sign-in form.
    const localDigits = localPartDigits(
      member.phone,
      this.getDialCodeForBranch(member.homeBranch),
    );
    const samePhoneMembers = await this.prisma.member.findMany({
      where: {
        OR: [
          { phone: member.phone },
          ...(localDigits ? [{ phone: { endsWith: localDigits } }] : []),
        ],
        pinHash: { not: null },
        id: { not: memberId },
      },
      select: { pinHash: true },
    });
    const pinTaken = samePhoneMembers.some(
      (other) => other.pinHash && pinMatches(other.pinHash, pin),
    );
    if (pinTaken) {
      throw new BadRequestException(
        'Another member with this phone number already uses this PIN. Choose a different PIN.',
      );
    }

    await this.prisma.member.update({
      where: { id: memberId },
      data: { pinHash: hashPin(pin) },
    });
  }

  /**
   * Member-triggered (via the mobile app's own bearer session, not staff):
   * registers/refreshes an FCM device token so announcement push sends can
   * reach this device. Upserts on (memberId, token) — re-registering the
   * same device just bumps lastSeenAt rather than creating a duplicate row.
   */
  async upsertDeviceToken(
    memberId: string,
    token: string,
    platform?: string,
  ): Promise<void> {
    const trimmed = token.trim();
    if (!trimmed) {
      throw new BadRequestException('Device token is required.');
    }

    await this.prisma.memberDeviceToken.upsert({
      where: { memberId_token: { memberId, token: trimmed } },
      create: {
        id: `device-token-${randomUUID()}`,
        memberId,
        token: trimmed,
        platform: platform?.trim() || undefined,
      },
      update: {
        platform: platform?.trim() || undefined,
        lastSeenAt: new Date(),
      },
    });
  }

  private async buildActiveSet(tenantId: string): Promise<Set<string>> {
    const today = new Date(localDateString());
    const activeMemberships = await this.prisma.membership.findMany({
      where: {
        member: { tenantId },
        status: { in: ['active', 'frozen'] },
        endDate: { gte: today },
      },
      select: { memberId: true },
    });
    return new Set(activeMemberships.map((m) => m.memberId));
  }

  private withComputedStatus(member: Member, activeIds: Set<string>) {
    return {
      ...this.serializeMember(member),
      status: (activeIds.has(member.id) ? 'active' : 'inactive') as
        | 'active'
        | 'inactive',
    };
  }

  // Postgres DATE columns come back as JS Date objects from Prisma; the API
  // contract (and the web app's raw string comparisons/display of these
  // fields) expects plain "YYYY-MM-DD" strings, same as the old JSON store.
  // pinHash is dropped here too — it must never reach a client response.
  private serializeMember<T extends Member>(
    member: T,
  ): Omit<T, 'dateOfBirth' | 'joinDate' | 'pinHash' | 'debt'> & {
    dateOfBirth: string | null;
    joinDate: string | null;
    debt: number;
  } {
    const { pinHash, ...rest } = member;
    void pinHash;
    return {
      ...rest,
      dateOfBirth: toDateOnlyString(member.dateOfBirth),
      joinDate: toDateOnlyString(member.joinDate),
      debt: toNumber(member.debt),
    } as Omit<T, 'dateOfBirth' | 'joinDate' | 'pinHash' | 'debt'> & {
      dateOfBirth: string | null;
      joinDate: string | null;
      debt: number;
    };
  }

  /** Recomputes on read rather than trusting the cached column — cheap, and
   * guarantees the figure shown at the point of recording a payment is
   * never stale even if some edge case caused the cache to drift. */
  async getMemberDebt(tenantId: string, memberId: string): Promise<number> {
    return this.debtService.recomputeForTenant(tenantId, memberId);
  }

  private normalizeMemberName(fullName: string) {
    const normalizedFullName = fullName.trim();

    if (!normalizedFullName) {
      throw new BadRequestException('Full name is required.');
    }

    return normalizedFullName;
  }

  private getDialCodeForBranch(branch: Branch): string | undefined {
    if (!branch.countryCode) return undefined;
    return findCountryByCode(branch.countryCode)?.dialCode;
  }

  private async ensureBranchBelongsToTenant(
    tenantId: string,
    branchId: string,
  ): Promise<Branch> {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });

    if (!branch) {
      throw new BadRequestException('Home branch is invalid for this tenant.');
    }

    return branch;
  }

  private async ensureEmployeeBelongsToTenant(
    tenantId: string,
    employeeId: string,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    if (!employee) {
      throw new BadRequestException(
        'Registered employee is invalid for this tenant.',
      );
    }
  }

  /**
   * Returns the QR code PNG for a member (session-authenticated callers).
   * Tries to fetch the device-generated QR image first; falls back to
   * generating one locally with the qrcode package so the endpoint is always
   * available even when the device is offline.
   */
  async getMemberQrCodeBuffer(
    tenantId: string,
    memberId: string,
  ): Promise<Buffer> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) throw new NotFoundException('Member not found.');
    return this.generateQrBuffer(member.id);
  }

  /**
   * Returns the QR code PNG for a member by ID only (no tenant check).
   * Used by the public/signed download endpoint; the HMAC signature in the
   * URL is the access control.
   */
  async getMemberQrCodeBufferById(memberId: string): Promise<Buffer> {
    return this.generateQrBuffer(memberId);
  }

  verifyQrSig(memberId: string, sig: string): boolean {
    return generateQrSig(memberId) === sig;
  }

  /**
   * Sends the QR code download link to the member's WhatsApp number.
   * Returns { sent: true } or { sent: false, reason: string }.
   */
  async sendQrViaWhatsApp(
    tenantId: string,
    branchId: string | undefined,
    memberId: string,
  ): Promise<{ sent: boolean; reason?: string }> {
    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        tenantId,
        ...(branchId ? { homeBranchId: branchId } : {}),
      },
    });
    if (!member) throw new NotFoundException('Member not found.');

    if (!member.phone) {
      return { sent: false, reason: 'Member has no phone number on file.' };
    }

    const apiKey = process.env.SPARKCO_API_KEY;
    const baseUrl =
      process.env.SPARKCO_API_URL ?? 'https://api.sparkco.vip/api/v1';

    if (!apiKey) {
      return { sent: false, reason: 'SparkCo is not configured (set SPARKCO_API_KEY).' };
    }

    const qrUrl = makeQrPublicUrl(member.id);
    const message =
      `Hi ${member.fullName}, your gym QR code is ready!\n\n` +
      `Tap this link to download your QR code, then show it at the entrance to enter:\n${qrUrl}\n\n` +
      `Save the image to your phone so you can access it even without internet.`;

    try {
      const res = await fetch(`${baseUrl}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ channel: 'whatsapp', to: member.phone, message }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const reason = `SparkCo error ${res.status}: ${text}`;
        this.logger.warn(`QR WhatsApp send failed for ${memberId}: ${reason}`);
        return { sent: false, reason };
      }

      this.logger.log(`QR code sent via WhatsApp to ${member.phone} (${memberId})`);
      return { sent: true };
    } catch (err) {
      const reason = (err as Error).message;
      this.logger.warn(`QR WhatsApp send failed for ${memberId}: ${reason}`);
      return { sent: false, reason };
    }
  }

  private async generateQrBuffer(memberId: string): Promise<Buffer> {
    // Generate locally — same UUID content the device stores, so the gate scans identically.
    // The device PNG is not special; fetching it just adds latency and a network dependency.
    const uuid = memberIdToUuid(memberId);
    return QRCode.toBuffer(uuid, { type: 'png', width: 400, margin: 2 });
  }

  private async getNextMemberNumber(tenantId: string): Promise<string> {
    // In-memory regex-filtered scan (not a SQL MAX), matching EmployeesService's
    // employeeNumber sequencing — avoids relying on lexicographic string MAX
    // collation behavior for what's semantically a numeric sequence.
    const members = await this.prisma.member.findMany({
      where: { tenantId },
      select: { memberNumber: true },
    });

    const usedSequences = members
      .map((member) => member.memberNumber.match(/^MEM-(\d{4})$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => Number(match[1]));
    const nextSequence = (Math.max(0, ...usedSequences) || 0) + 1;

    return `MEM-${String(nextSequence).padStart(4, '0')}`;
  }
}
