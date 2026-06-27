import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { memberIdToUuid } from '../../common/qr';
import type { GateRecord } from '../../data/operations-store';

type DeviceConfig = {
  deviceUrl: string;
  deviceUsername: string;
  devicePassword: string;
};

/**
 * Pushes member RFID/QR identifiers to BAS-IP devices so the device can grant
 * access even when our server is unreachable.
 *
 * Every identifier is stored with a `valid.time` window matching the
 * membership start/end dates, so the device enforces expiry automatically
 * without any explicit removal when a membership lapses.
 *
 * Devices live on the gym's LOCAL network (e.g. http://192.168.1.178).
 * Our VPS cannot reach them directly. All sync calls are therefore
 * best-effort: if the device is unreachable the method logs a warning and
 * returns without error. The Remote Access Server (POST /api/access/bas-ip)
 * continues to handle all real-time validation regardless.
 *
 * link_id design:
 *   Member IDs are "member-<uuid>". We strip the prefix to get a clean UUID
 *   that the device accepts as link_id. This lets us update/delete identifiers
 *   by our own member ID without storing the device's internal integer UID.
 */
@Injectable()
export class BasIpSyncService {
  private readonly logger = new Logger(BasIpSyncService.name);

  // ---------------------------------------------------------------------------
  // Gate-config helpers
  // ---------------------------------------------------------------------------

  private configFromGate(gate: GateRecord): DeviceConfig {
    return {
      deviceUrl: gate.deviceUrl,
      deviceUsername: gate.deviceUsername,
      devicePassword: gate.devicePassword,
    };
  }

  /**
   * Returns the legacy single-device config from env vars, or null if
   * BASIP_DEVICE_URL is not set.
   */
  private envConfig(): DeviceConfig | null {
    const deviceUrl = process.env.BASIP_DEVICE_URL ?? null;
    if (!deviceUrl) return null;
    return {
      deviceUrl,
      deviceUsername: process.env.BASIP_DEVICE_USERNAME ?? 'admin',
      devicePassword: process.env.BASIP_DEVICE_PASSWORD ?? '',
    };
  }

  // ---------------------------------------------------------------------------
  // Public methods — all accept an explicit GateRecord
  // ---------------------------------------------------------------------------

  /**
   * Push (create or update) a QR identifier for the member on the given gate
   * device. Called after membership creation/renewal.
   *
   * Returns the device's internal identifier uid on success (needed to fetch
   * the QR image), or null on failure / device unreachable.
   */
  async pushQrIdentifier(
    memberId: string,
    memberName: string,
    membershipStartDate: string,
    membershipEndDate: string,
    gate?: GateRecord,
  ): Promise<number | null> {
    const config = gate ? this.configFromGate(gate) : this.envConfig();
    if (!config) return null;

    const token = await this.authenticate(config);
    if (!token) return null;

    const linkId = memberIdToUuid(memberId);
    const from = this.dateToUnix(membershipStartDate, 'start');
    const to = this.dateToUnix(membershipEndDate, 'end');

    const body = {
      list_items: [
        {
          identifier_owner: { name: memberName, type: 'owner' },
          identifier_type: 'qr',
          identifier_number: linkId,
          lock: 'first',
          valid: {
            time: { is_permanent: false, from, to },
            passes: { is_permanent: true },
          },
          link_id: linkId,
          apartment_link_id: linkId,
        },
      ],
    };

    try {
      const res = await fetch(
        `${config.deviceUrl}/api/v1/access/identifier/items/link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        this.logger.warn(
          `BAS-IP QR push failed for member ${memberId}: HTTP ${res.status}`,
        );
        return null;
      }

      const uid = await this.lookupUidByLinkId(linkId, token, config);
      this.logger.log(
        `Synced QR identifier for member ${memberId} (valid ${membershipStartDate} → ${membershipEndDate})`,
      );
      return uid;
    } catch (err) {
      this.logger.warn(
        `BAS-IP QR push failed for member ${memberId}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Retrieves the QR code PNG that the device generated for a stored QR
   * identifier. Returns the PNG buffer, or null if the device is unreachable
   * or the identifier uid is unknown.
   */
  async fetchQrPngFromDevice(
    identifierUid: number,
    gate?: GateRecord,
  ): Promise<Buffer | null> {
    const config = gate ? this.configFromGate(gate) : this.envConfig();
    if (!config) return null;

    const token = await this.authenticate(config);
    if (!token) return null;

    try {
      const res = await fetch(
        `${config.deviceUrl}/api/v1/access/identifier/item/${identifierUid}/qr`,
        {
          headers: {
            Accept: 'image/png',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        this.logger.warn(`BAS-IP QR image fetch failed: HTTP ${res.status}`);
        return null;
      }

      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      this.logger.warn(
        `BAS-IP QR image fetch failed: ${(err as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Push (create or update) an RFID card identifier for the member on the
   * given gate device. Called after membership creation or renewal.
   *
   * Silently skips if the member has no rfidTag or the device is unreachable.
   */
  async pushIdentifier(
    memberId: string,
    memberName: string,
    rfidTag: string,
    membershipStartDate: string,
    membershipEndDate: string,
    gate?: GateRecord,
  ): Promise<void> {
    const config = gate ? this.configFromGate(gate) : this.envConfig();
    if (!config) return;

    const token = await this.authenticate(config);
    if (!token) return;

    const linkId = memberIdToUuid(memberId);
    const from = this.dateToUnix(membershipStartDate, 'start');
    const to = this.dateToUnix(membershipEndDate, 'end');

    const body = {
      list_items: [
        {
          identifier_owner: { name: memberName, type: 'owner' },
          identifier_type: 'card',
          identifier_number: this.formatCardNumber(rfidTag),
          lock: 'first',
          valid: {
            time: { is_permanent: false, from, to },
            passes: { is_permanent: true },
          },
          link_id: linkId,
          apartment_link_id: linkId,
        },
      ],
    };

    try {
      const res = await fetch(
        `${config.deviceUrl}/api/v1/access/identifier/items/link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        this.logger.warn(
          `BAS-IP push failed for member ${memberId}: HTTP ${res.status}`,
        );
        return;
      }

      this.logger.log(
        `Synced RFID identifier for member ${memberId} (valid ${membershipStartDate} → ${membershipEndDate})`,
      );
    } catch (err) {
      this.logger.warn(
        `BAS-IP push failed for member ${memberId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Remove the identifier for a member from the given gate device. Called when
   * a member is deactivated or their membership is cancelled.
   *
   * Note: expiry is already enforced by valid.time on the device, so this is
   * only needed for immediate revocation.
   */
  async removeIdentifier(memberId: string, gate?: GateRecord): Promise<void> {
    const config = gate ? this.configFromGate(gate) : this.envConfig();
    if (!config) return;

    const token = await this.authenticate(config);
    if (!token) return;

    const linkId = memberIdToUuid(memberId);

    try {
      const res = await fetch(
        `${config.deviceUrl}/api/v1/access/identifier/items/link`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ link_ids: [linkId] }),
        },
      );

      if (!res.ok) {
        this.logger.warn(
          `BAS-IP remove failed for member ${memberId}: HTTP ${res.status}`,
        );
        return;
      }

      this.logger.log(
        `Removed identifier for member ${memberId} from BAS-IP device`,
      );
    } catch (err) {
      this.logger.warn(
        `BAS-IP remove failed for member ${memberId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Opens a lock on the given gate device immediately. Called by staff from
   * the check-in page when a member has forgotten their card (manual override).
   * Falls back to the env-var single device if no gate is provided.
   */
  async openGate(gate?: GateRecord): Promise<{ opened: boolean; reason?: string }> {
    const config = gate ? this.configFromGate(gate) : this.envConfig();
    if (!config) {
      return { opened: false, reason: 'Gate device is not configured.' };
    }

    const token = await this.authenticate(config);
    if (!token) {
      return {
        opened: false,
        reason: 'Could not authenticate with gate device.',
      };
    }

    const lockNumber = gate?.lockNumber ?? 1;

    try {
      const res = await fetch(
        `${config.deviceUrl}/api/v1/access/general/lock/open/remote/accepted/${lockNumber}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        return {
          opened: false,
          reason: `Device returned HTTP ${res.status}.`,
        };
      }

      this.logger.log(
        `Gate ${gate?.id ?? 'default'} opened by staff (manual override)`,
      );
      return { opened: true };
    } catch (err) {
      return { opened: false, reason: (err as Error).message };
    }
  }

  async lookupQrUidForMember(
    memberId: string,
    gate?: GateRecord,
  ): Promise<number | null> {
    const config = gate ? this.configFromGate(gate) : this.envConfig();
    if (!config) return null;
    const token = await this.authenticate(config);
    if (!token) return null;
    return this.lookupUidByLinkId(memberIdToUuid(memberId), token, config);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async authenticate(config: DeviceConfig): Promise<string | null> {
    const md5 = createHash('md5')
      .update(config.devicePassword)
      .digest('hex')
      .toUpperCase();

    try {
      const res = await fetch(
        `${config.deviceUrl}/api/v1/login?username=${encodeURIComponent(config.deviceUsername)}&password=${encodeURIComponent(md5)}`,
        { headers: { Accept: 'application/json' } },
      );

      if (!res.ok) {
        this.logger.warn(`BAS-IP login failed: HTTP ${res.status}`);
        return null;
      }

      const data = (await res.json()) as { token?: string };
      return data.token ?? null;
    } catch (err) {
      this.logger.warn(`BAS-IP device unreachable: ${(err as Error).message}`);
      return null;
    }
  }

  private formatCardNumber(rfidTag: string): string {
    const clean = rfidTag.toUpperCase().replace(/[:\-\s]/g, '');
    return clean.match(/.{2}/g)?.join(':') ?? clean;
  }

  private dateToUnix(dateStr: string, edge: 'start' | 'end'): number {
    const suffix = edge === 'end' ? 'T23:59:59Z' : 'T00:00:00Z';
    return Math.floor(new Date(dateStr + suffix).getTime() / 1000);
  }

  private async lookupUidByLinkId(
    linkId: string,
    token: string,
    config: DeviceConfig,
  ): Promise<number | null> {
    try {
      const res = await fetch(
        `${config.deviceUrl}/api/v1/access/identifier/items/link?link_id=${encodeURIComponent(linkId)}&limit=1&page_number=1`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { list_items?: { uid?: number }[] };
      return data.list_items?.[0]?.uid ?? null;
    } catch {
      return null;
    }
  }
}
