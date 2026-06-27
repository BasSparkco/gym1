import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { localDateString } from '../../common/date';
import { memberIdToUuid } from '../../common/qr';
import {
  VisitRecord,
  readOperationsStore,
  writeOperationsStore,
} from '../../data/operations-store';

export type AccessResult =
  | { granted: false; reason: string }
  | {
      granted: true;
      member: { id: string; fullName: string; memberNumber: string };
      visit: VisitRecord;
    };

@Injectable()
export class AccessService {
  /**
   * Validates access for a presented identifier and logs a visit on success.
   *
   * @param identifierNumber - the raw identifier from the device (RFID tag, QR payload, or input code)
   * @param identifierType   - how the identifier was read: 'card' | 'qr' | 'input_code'
   * @param branchId         - which branch the device is installed at
   * @param gateId           - which gate the request came from (optional); used to enforce gender restrictions
   */
  checkAccess(
    identifierNumber: string,
    identifierType: 'card' | 'qr' | 'input_code',
    branchId: string,
    gateId?: string,
  ): AccessResult {
    const store = readOperationsStore();
    const today = localDateString();

    const branch = store.branches.find((b) => b.id === branchId);
    if (!branch) {
      return { granted: false, reason: 'Unknown branch.' };
    }

    const member = this.resolveMember(
      store,
      branch.tenantId,
      identifierNumber,
      identifierType,
    );
    if (!member) {
      return { granted: false, reason: 'Unknown card.' };
    }

    const membership = store.memberships.find(
      (ms) =>
        ms.memberId === member.id &&
        ms.status === 'active' &&
        ms.startDate <= today &&
        ms.endDate >= today,
    );
    if (!membership) {
      return { granted: false, reason: 'No active membership.' };
    }

    // Gate-level gender restriction check
    if (gateId) {
      const gate = store.gates.find(
        (g) => g.id === gateId && g.tenantId === branch.tenantId,
      );
      if (gate && gate.genderRestriction && gate.genderRestriction !== member.sex) {
        const genderLabel = gate.genderRestriction === 'male' ? "men's" : "women's";
        return {
          granted: false,
          reason: `This gate is for ${genderLabel} only.`,
        };
      }
    }

    const alreadyCheckedIn = store.visits.some(
      (v) =>
        v.memberId === member.id &&
        v.branchId === branchId &&
        v.checkInTime.startsWith(today) &&
        v.checkOutTime === null,
    );
    if (alreadyCheckedIn) {
      return { granted: false, reason: 'Member is already checked in.' };
    }

    const accessMethod: VisitRecord['accessMethod'] =
      identifierType === 'card' ? 'rfid' : 'qr';

    const visit: VisitRecord = {
      id: `visit-${randomUUID()}`,
      memberId: member.id,
      branchId,
      checkInTime: new Date().toISOString(),
      checkOutTime: null,
      accessMethod,
      ...(gateId && { gateId }),
    };

    store.visits.push(visit);
    writeOperationsStore(store);

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

  private resolveMember(
    store: ReturnType<typeof readOperationsStore>,
    tenantId: string,
    identifierNumber: string,
    identifierType: 'card' | 'qr' | 'input_code',
  ) {
    const tenantMembers = store.members.filter((m) => m.tenantId === tenantId);

    if (identifierType === 'card') {
      const tag = identifierNumber.toUpperCase().replace(/[:\-]/g, '');
      return tenantMembers.find((m) => m.rfidTag === tag) ?? null;
    }

    // qr and input_code: identifier_number is the UUID pushed to the BAS-IP device
    return (
      tenantMembers.find(
        (m) =>
          memberIdToUuid(m.id) === identifierNumber ||
          m.id === identifierNumber ||
          m.memberNumber === identifierNumber,
      ) ?? null
    );
  }
}
