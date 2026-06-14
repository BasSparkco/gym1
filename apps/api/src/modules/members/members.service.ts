import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { normalizePhone } from '../../common/phone';
import { findCountryByCode } from '../../data/countries';
import {
  MemberRecord,
  readOperationsStore,
  writeOperationsStore,
} from '../../data/operations-store';

type CreateMemberInput = {
  fullName?: string;
  homeBranchId?: string;
  status?: MemberRecord['status'];
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
};

type UpdateMemberInput = {
  fullName?: string;
  homeBranchId?: string;
  status?: MemberRecord['status'];
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
};

const validMemberStatuses = new Set<MemberRecord['status']>([
  'active',
  'inactive',
]);

@Injectable()
export class MembersService {
  getReportingDate() {
    return readOperationsStore().reportingDate;
  }

  listMembersForScope(tenantId: string, branchId: string) {
    const store = readOperationsStore();

    return store.members.filter((member) => {
      return member.tenantId === tenantId && member.homeBranchId === branchId;
    });
  }

  listMembersForTenant(tenantId: string) {
    return readOperationsStore().members.filter((member) => {
      return member.tenantId === tenantId;
    });
  }

  getMemberForScope(tenantId: string, branchId: string, memberId: string) {
    const member = readOperationsStore().members.find((candidate) => {
      return (
        candidate.id === memberId &&
        candidate.tenantId === tenantId &&
        candidate.homeBranchId === branchId
      );
    });

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    return member;
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
      status: this.normalizeMemberStatus(input.status),
      phone: normalizePhone(input.phone, dialCode),
      email: input.email?.trim().toLowerCase() || undefined,
      dateOfBirth: input.dateOfBirth?.trim() || undefined,
      emergencyContactName: input.emergencyContactName?.trim() || undefined,
      emergencyContactPhone: normalizePhone(input.emergencyContactPhone, dialCode),
      medicalNotes: input.medicalNotes?.trim() || undefined,
    };

    store.members.push(member);
    writeOperationsStore(store);

    return member;
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
      status:
        input.status === undefined
          ? currentMember.status
          : this.normalizeMemberStatus(input.status),
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
    };

    store.members[memberIndex] = nextMember;
    writeOperationsStore(store);

    return nextMember;
  }

  private normalizeMemberName(fullName: string) {
    const normalizedFullName = fullName.trim();

    if (!normalizedFullName) {
      throw new BadRequestException('Full name is required.');
    }

    return normalizedFullName;
  }

  private normalizeMemberStatus(status: MemberRecord['status'] | undefined) {
    if (!status) {
      return 'active';
    }

    if (!validMemberStatuses.has(status)) {
      throw new BadRequestException('Member status is invalid.');
    }

    return status;
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
