import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as QRCode from 'qrcode';
import { localDateString } from '../../common/date';
import { generateQrSig, makeQrPublicUrl, memberIdToUuid } from '../../common/qr';
import { normalizePhone } from '../../common/phone';
import { findCountryByCode } from '../../data/countries';
import {
  MemberRecord,
  readOperationsStore,
  writeOperationsStore,
} from '../../data/operations-store';
import { BasIpSyncService } from '../access/bas-ip-sync.service';

type CreateMemberInput = {
  fullName?: string;
  homeBranchId?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  sex?: MemberRecord['sex'];
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
  sex?: MemberRecord['sex'];
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

  constructor(private readonly basIpSyncService: BasIpSyncService) {}

  getReportingDate() {
    return localDateString();
  }

  listMembersForScope(tenantId: string, branchId: string) {
    const store = readOperationsStore();
    const activeIds = this.buildActiveSet(store);
    return store.members
      .filter((m) => m.tenantId === tenantId && m.homeBranchId === branchId)
      .map((m) => this.withComputedStatus(m, activeIds));
  }

  listMembersForTenant(tenantId: string) {
    const store = readOperationsStore();
    const activeIds = this.buildActiveSet(store);
    return store.members
      .filter((m) => m.tenantId === tenantId)
      .map((m) => this.withComputedStatus(m, activeIds));
  }

  getMemberForScope(tenantId: string, branchId: string, memberId: string) {
    const store = readOperationsStore();
    const member = store.members.find(
      (m) =>
        m.id === memberId &&
        m.tenantId === tenantId &&
        m.homeBranchId === branchId,
    );

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const activeIds = this.buildActiveSet(store);
    return this.withComputedStatus(member, activeIds);
  }

  createMember(tenantId: string, branchId: string, input: CreateMemberInput) {
    const fullName = input.fullName?.trim();

    if (!fullName) {
      throw new BadRequestException('Full name is required.');
    }

    const store = readOperationsStore();
    const homeBranchId = input.homeBranchId ?? branchId;
    this.ensureBranchBelongsToTenant(store, tenantId, homeBranchId);

    const dialCode = this.getDialCodeForBranch(store, homeBranchId);

    const member: MemberRecord = {
      id: `member-${randomUUID()}`,
      tenantId,
      homeBranchId,
      memberNumber: this.getNextMemberNumber(store.members, tenantId),
      fullName,
      joinDate: localDateString(),
      phone: normalizePhone(input.phone, dialCode),
      email: input.email?.trim().toLowerCase() || undefined,
      dateOfBirth: input.dateOfBirth?.trim() || undefined,
      sex: input.sex || undefined,
      idNumber: input.idNumber?.trim() || undefined,
      address: input.address?.trim() || undefined,
      height: input.height ? Number(input.height) : undefined,
      weight: input.weight ? Number(input.weight) : undefined,
      registeredEmployeeId: input.registeredEmployeeId?.trim() || undefined,
      emergencyContactName: input.emergencyContactName?.trim() || undefined,
      emergencyContactPhone: normalizePhone(input.emergencyContactPhone, dialCode),
      medicalNotes: input.medicalNotes?.trim() || undefined,
      rfidTag: input.rfidTag?.trim().toUpperCase() || undefined,
    };

    store.members.push(member);
    writeOperationsStore(store);

    const activeIds = this.buildActiveSet(store);
    return this.withComputedStatus(member, activeIds);
  }

  updateMember(
    tenantId: string,
    branchId: string,
    memberId: string,
    input: UpdateMemberInput,
  ) {
    const store = readOperationsStore();
    const memberIndex = store.members.findIndex((candidate) => {
      return (
        candidate.id === memberId &&
        candidate.tenantId === tenantId &&
        candidate.homeBranchId === branchId
      );
    });

    if (memberIndex === -1) {
      throw new NotFoundException('Member not found.');
    }

    const currentMember = store.members[memberIndex];
    const nextFullName =
      input.fullName === undefined
        ? currentMember.fullName
        : this.normalizeMemberName(input.fullName);
    const nextHomeBranchId = input.homeBranchId ?? currentMember.homeBranchId;

    this.ensureBranchBelongsToTenant(store, tenantId, nextHomeBranchId);

    const dialCode = this.getDialCodeForBranch(store, nextHomeBranchId);

    const nextMember: MemberRecord = {
      ...currentMember,
      fullName: nextFullName,
      homeBranchId: nextHomeBranchId,
      phone:
        input.phone === undefined
          ? currentMember.phone
          : normalizePhone(input.phone, dialCode),
      email:
        input.email === undefined
          ? currentMember.email
          : input.email.trim().toLowerCase() || undefined,
      dateOfBirth:
        input.dateOfBirth === undefined
          ? currentMember.dateOfBirth
          : input.dateOfBirth.trim() || undefined,
      sex:
        input.sex === undefined ? currentMember.sex : input.sex || undefined,
      idNumber:
        input.idNumber === undefined
          ? currentMember.idNumber
          : input.idNumber.trim() || undefined,
      address:
        input.address === undefined
          ? currentMember.address
          : input.address.trim() || undefined,
      height:
        input.height === undefined
          ? currentMember.height
          : input.height ? Number(input.height) : undefined,
      weight:
        input.weight === undefined
          ? currentMember.weight
          : input.weight ? Number(input.weight) : undefined,
      registeredEmployeeId:
        input.registeredEmployeeId === undefined
          ? currentMember.registeredEmployeeId
          : input.registeredEmployeeId.trim() || undefined,
      emergencyContactName:
        input.emergencyContactName === undefined
          ? currentMember.emergencyContactName
          : input.emergencyContactName.trim() || undefined,
      emergencyContactPhone:
        input.emergencyContactPhone === undefined
          ? currentMember.emergencyContactPhone
          : normalizePhone(input.emergencyContactPhone, dialCode),
      medicalNotes:
        input.medicalNotes === undefined
          ? currentMember.medicalNotes
          : input.medicalNotes.trim() || undefined,
      rfidTag:
        input.rfidTag === undefined
          ? currentMember.rfidTag
          : input.rfidTag.trim().toUpperCase() || undefined,
    };

    store.members[memberIndex] = nextMember;
    writeOperationsStore(store);

    const activeIds = this.buildActiveSet(store);
    return this.withComputedStatus(nextMember, activeIds);
  }

  updateMemberPicture(
    tenantId: string,
    branchId: string,
    memberId: string,
    pictureUrl: string,
  ) {
    const store = readOperationsStore();
    const memberIndex = store.members.findIndex((candidate) => {
      return (
        candidate.id === memberId &&
        candidate.tenantId === tenantId &&
        candidate.homeBranchId === branchId
      );
    });

    if (memberIndex === -1) {
      throw new NotFoundException('Member not found.');
    }

    store.members[memberIndex] = { ...store.members[memberIndex], pictureUrl };
    writeOperationsStore(store);
    return store.members[memberIndex];
  }

  private buildActiveSet(
    store: ReturnType<typeof readOperationsStore>,
  ): Set<string> {
    const today = new Date().toISOString().slice(0, 10);
    const activeIds = new Set<string>();
    for (const ms of store.memberships) {
      if (
        (ms.status === 'active' || ms.status === 'frozen') &&
        ms.endDate >= today
      ) {
        activeIds.add(ms.memberId);
      }
    }
    return activeIds;
  }

  private withComputedStatus(
    member: MemberRecord,
    activeIds: Set<string>,
  ): MemberRecord & { status: 'active' | 'inactive' } {
    return {
      ...member,
      status: activeIds.has(member.id) ? 'active' : 'inactive',
    };
  }

  private normalizeMemberName(fullName: string) {
    const normalizedFullName = fullName.trim();

    if (!normalizedFullName) {
      throw new BadRequestException('Full name is required.');
    }

    return normalizedFullName;
  }

  private getDialCodeForBranch(
    store: ReturnType<typeof readOperationsStore>,
    branchId: string,
  ): string | undefined {
    const branch = store.branches.find((b) => b.id === branchId);
    if (!branch?.countryCode) return undefined;
    return findCountryByCode(branch.countryCode)?.dialCode;
  }

  private ensureBranchBelongsToTenant(
    store: ReturnType<typeof readOperationsStore>,
    tenantId: string,
    branchId: string,
  ) {
    const branch = store.branches.find((candidate) => {
      return candidate.id === branchId && candidate.tenantId === tenantId;
    });

    if (!branch) {
      throw new BadRequestException('Home branch is invalid for this tenant.');
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
    const member = readOperationsStore().members.find(
      (m) => m.id === memberId && m.tenantId === tenantId,
    );
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
    branchId: string,
    memberId: string,
  ): Promise<{ sent: boolean; reason?: string }> {
    const member = readOperationsStore().members.find(
      (m) =>
        m.id === memberId &&
        m.tenantId === tenantId &&
        m.homeBranchId === branchId,
    );
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

  private getNextMemberNumber(members: MemberRecord[], tenantId: string) {
    const usedSequences = members
      .filter((member) => member.tenantId === tenantId)
      .map((member) => member.memberNumber.match(/^MEM-(\d{4})$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => Number(match[1]));
    const nextSequence = (Math.max(0, ...usedSequences) || 0) + 1;

    return `MEM-${String(nextSequence).padStart(4, '0')}`;
  }
}
