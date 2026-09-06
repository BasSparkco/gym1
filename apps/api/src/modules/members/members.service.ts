import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as QRCode from 'qrcode';
import { localDateString, toDateOnlyString } from '../../common/date';
import {
  generateQrSig,
  makeQrPublicUrl,
  memberIdToUuid,
} from '../../common/qr';
import { localPartDigits, normalizePhone } from '../../common/phone';
import { hashPin, pinMatches } from '../../common/pin-hash';
import { decryptPin, encryptPin } from '../../common/pin-crypto';
import { toNumber } from '../../common/decimal';
import { nextMemberNumber } from '../../common/org-numbering';
import { findCountryByCode } from '../../data/countries';
import { BasIpSyncService } from '../access/bas-ip-sync.service';
import { DebtService } from '../debt/debt.service';
import { NotificationTemplatesService } from '../notifications/notification-templates.service';
import { SparkcoNotificationProvider } from '../notifications/providers/sparkco-notification.provider';
import { SettingsService } from '../settings/settings.service';
import { resolveWhatsAppSessionBranchId } from '../tenancy/whatsapp-session';
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
  joinDate?: string;
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
    private readonly notificationTemplatesService: NotificationTemplatesService,
    private readonly sparkcoProvider: SparkcoNotificationProvider,
    private readonly settingsService: SettingsService,
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

    const registeredEmployeeId =
      input.registeredEmployeeId?.trim() || undefined;
    if (registeredEmployeeId) {
      await this.ensureEmployeeBelongsToTenant(tenantId, registeredEmployeeId);
    }

    const dialCode = this.getDialCodeForBranch(branch);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { code: true },
    });
    const memberNumber = await nextMemberNumber(
      this.prisma,
      tenantId,
      tenant?.code ?? null,
    );

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

    // Automatic PIN delivery on creation — best-effort, doesn't fail member
    // creation if SparkCo is unreachable. Without a phone the mobile app has
    // no way to sign the member in (it authenticates by phone + PIN), so
    // there's nothing to generate or send.
    const pinDispatch = member.phone
      ? await this.issueAndSendPin(tenantId, member, dialCode)
      : undefined;

    // A brand-new member can't have an existing active membership yet.
    return {
      ...this.serializeMember(member),
      status: 'inactive' as const,
      pinDispatch,
    };
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
            : (normalizePhone(input.phone, dialCode) ?? null),
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
        // Members imported from another system often arrive with no join
        // date. Staff can fill it in exactly once — once a join date is on
        // record, this silently ignores further attempts to change it
        // rather than letting a stray request quietly rewrite a member's
        // tenure, matching the edit form only rendering the field as
        // editable while it's still null.
        joinDate:
          input.joinDate === undefined || current.joinDate !== null
            ? undefined
            : input.joinDate.trim()
              ? new Date(input.joinDate.trim())
              : undefined,
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
            : (normalizePhone(input.emergencyContactPhone, dialCode) ?? null),
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

  // Resolves a stored photo filename back to the member it belongs to, scoped
  // to one tenant so a filename can never be used to reach into another
  // tenant's photos. Used by MemberPhotosController to authorize both staff
  // and member requests before streaming the file from MinIO.
  async findMemberByPictureFilename(tenantId: string, filename: string) {
    return this.prisma.member.findFirst({
      where: { tenantId, pictureUrl: { endsWith: `/${filename}` } },
    });
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

    const available = await this.isPinAvailableForPhone(
      member.phone,
      this.getDialCodeForBranch(member.homeBranch),
      memberId,
      pin,
    );
    if (!available) {
      throw new BadRequestException(
        'Another member with this phone number already uses this PIN. Choose a different PIN.',
      );
    }

    await this.prisma.member.update({
      where: { id: memberId },
      data: { pinHash: hashPin(pin), pinEncrypted: encryptPin(pin) },
    });
  }

  /**
   * Staff-facing lookup for the PIN popup: decrypts the currently stored
   * PIN, if any. Returns null both when no PIN has ever been set and when
   * one was set before pinEncrypted existed (nothing to decrypt) — either
   * way the UI's answer is "no PIN on file, set or send a new one".
   */
  async getCurrentPin(
    tenantId: string,
    branchId: string | undefined,
    memberId: string,
  ): Promise<{ pin: string | null }> {
    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        tenantId,
        ...(branchId ? { homeBranchId: branchId } : {}),
      },
      select: { pinEncrypted: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    return {
      pin: member.pinEncrypted ? decryptPin(member.pinEncrypted) : null,
    };
  }

  /**
   * Staff-triggered: generates a brand-new random PIN and sends it via
   * WhatsApp/email, same as the automatic one-time send on member creation
   * (see issueAndSendPin) — used by the PIN popup's "Send new PIN" action to
   * reissue one, e.g. if the member lost the original message.
   */
  async resendPin(
    tenantId: string,
    branchId: string | undefined,
    memberId: string,
  ): Promise<{
    whatsapp?: { sent: boolean; reason?: string };
    email?: { sent: boolean; reason?: string };
  }> {
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

    return this.issueAndSendPin(
      tenantId,
      member,
      this.getDialCodeForBranch(member.homeBranch),
    );
  }

  // The app signs in by phone (international or local form) and
  // disambiguates by PIN, so the same identifier + PIN pair must be unique
  // across ALL tenants (one person can be a member of two gyms with the
  // same phone — different PINs keep the accounts distinguishable at
  // sign-in). Matching on the local digits too is deliberately broader
  // than exact phone equality: two numbers that only differ in country
  // code collide on the local sign-in form.
  private async isPinAvailableForPhone(
    phone: string,
    dialCode: string | undefined,
    excludeMemberId: string,
    pin: string,
  ): Promise<boolean> {
    const localDigits = localPartDigits(phone, dialCode);
    const samePhoneMembers = await this.prisma.member.findMany({
      where: {
        OR: [
          { phone },
          ...(localDigits ? [{ phone: { endsWith: localDigits } }] : []),
        ],
        pinHash: { not: null },
        id: { not: excludeMemberId },
      },
      select: { pinHash: true },
    });
    return !samePhoneMembers.some(
      (other) => other.pinHash && pinMatches(other.pinHash, pin),
    );
  }

  /**
   * Picks a random 6-digit PIN that isn't already in use by another member
   * sharing this phone number (see isPinAvailableForPhone). Collisions are
   * rare enough that a handful of retries is always enough in practice.
   */
  private async generateUniquePin(
    phone: string,
    dialCode: string | undefined,
    excludeMemberId: string,
  ): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      if (
        await this.isPinAvailableForPhone(phone, dialCode, excludeMemberId, pin)
      ) {
        return pin;
      }
    }
    throw new Error('Could not generate a unique app PIN.');
  }

  /**
   * Generates this new member's app-sign-in PIN, stores its hash, and sends
   * the plaintext PIN once over WhatsApp and (if on file) email — the only
   * way a member ever learns it, since it's never returned by the API or
   * shown in the UI once hashed. Best-effort per channel: a delivery
   * failure is reported back but never throws, so it can't block member
   * creation itself.
   */
  private async issueAndSendPin(
    tenantId: string,
    member: Member,
    dialCode: string | undefined,
  ): Promise<{
    whatsapp?: { sent: boolean; reason?: string };
    email?: { sent: boolean; reason?: string };
  }> {
    const pin = await this.generateUniquePin(
      member.phone!,
      dialCode,
      member.id,
    );
    await this.prisma.member.update({
      where: { id: member.id },
      data: { pinHash: hashPin(pin), pinEncrypted: encryptPin(pin) },
    });

    const [{ defaultLanguage }, branch] = await Promise.all([
      this.settingsService.getSettingsForTenant(tenantId),
      this.prisma.branch.findUniqueOrThrow({
        where: { id: member.homeBranchId },
        select: { name: true },
      }),
    ]);
    const { subject, body } =
      await this.notificationTemplatesService.getRenderedTemplate(
        tenantId,
        'memberPin',
        defaultLanguage,
        { memberName: member.fullName, pin },
        branch.name,
      );

    const result: {
      whatsapp?: { sent: boolean; reason?: string };
      email?: { sent: boolean; reason?: string };
    } = {};

    const sessionId = await resolveWhatsAppSessionBranchId(
      this.prisma,
      member.homeBranchId,
    );
    const waResult = await this.sparkcoProvider.send({
      channel: 'whatsapp',
      to: member.phone!,
      subject: '',
      body,
      sessionId,
    });
    result.whatsapp =
      waResult.status === 'sent'
        ? { sent: true }
        : { sent: false, reason: waResult.error };
    if (waResult.status !== 'sent') {
      this.logger.warn(
        `PIN WhatsApp send failed for ${member.id}: ${waResult.error}`,
      );
    }

    if (member.email) {
      const emailResult = await this.sparkcoProvider.send({
        channel: 'email',
        to: member.email,
        subject,
        body,
      });
      result.email =
        emailResult.status === 'sent'
          ? { sent: true }
          : { sent: false, reason: emailResult.error };
      if (emailResult.status !== 'sent') {
        this.logger.warn(
          `PIN email send failed for ${member.id}: ${emailResult.error}`,
        );
      }
    }

    return result;
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
      status: activeIds.has(member.id) ? 'active' : 'inactive',
    };
  }

  // Postgres DATE columns come back as JS Date objects from Prisma; the API
  // contract (and the web app's raw string comparisons/display of these
  // fields) expects plain "YYYY-MM-DD" strings, same as the old JSON store.
  // pinHash/pinEncrypted are dropped here too — neither must ever reach a
  // client response (the PIN popup fetches pinEncrypted's decrypted value
  // through its own dedicated, explicit endpoint instead).
  private serializeMember<T extends Member>(
    member: T,
  ): Omit<
    T,
    'dateOfBirth' | 'joinDate' | 'pinHash' | 'pinEncrypted' | 'debt'
  > & {
    dateOfBirth: string | null;
    joinDate: string | null;
    debt: number;
  } {
    const { pinHash, pinEncrypted, ...rest } = member;
    void pinHash;
    void pinEncrypted;
    return {
      ...rest,
      dateOfBirth: toDateOnlyString(member.dateOfBirth),
      joinDate: toDateOnlyString(member.joinDate),
      debt: toNumber(member.debt),
    } as Omit<
      T,
      'dateOfBirth' | 'joinDate' | 'pinHash' | 'pinEncrypted' | 'debt'
    > & {
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
   * Sends the QR code as a WhatsApp image attachment to the member's
   * number, in the tenant's default language (owner-editable at
   * /app/settings/notifications/templates under "Member QR code").
   * Same shape/behavior as EmployeeAttendanceService.sendQrViaWhatsApp.
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
      return {
        sent: false,
        reason: 'SparkCo is not configured (set SPARKCO_API_KEY).',
      };
    }

    const qrUrl = makeQrPublicUrl(member.id);
    const [{ defaultLanguage }, branch, sessionId] = await Promise.all([
      this.settingsService.getSettingsForTenant(tenantId),
      this.prisma.branch.findUniqueOrThrow({
        where: { id: member.homeBranchId },
        select: { name: true },
      }),
      resolveWhatsAppSessionBranchId(this.prisma, member.homeBranchId),
    ]);
    const { body: message } =
      await this.notificationTemplatesService.getRenderedTemplate(
        tenantId,
        'memberQrCode',
        defaultLanguage,
        { memberName: member.fullName, qrUrl },
        branch.name,
      );

    try {
      const res = await fetch(`${baseUrl}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          channel: 'whatsapp',
          to: member.phone,
          message,
          mediaUrl: qrUrl,
          sessionId,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const reason = `SparkCo error ${res.status}: ${text}`;
        this.logger.warn(`QR WhatsApp send failed for ${memberId}: ${reason}`);
        return { sent: false, reason };
      }

      this.logger.log(
        `QR code sent via WhatsApp to ${member.phone} (${memberId})`,
      );
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
}
