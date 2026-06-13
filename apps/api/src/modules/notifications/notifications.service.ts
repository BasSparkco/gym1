import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  NotificationChannel,
  NotificationEvent,
  NotificationRecord,
  readOperationsStore,
  writeOperationsStore,
} from '../../data/operations-store';
import {
  getDefaultTenantSettings,
  readSettingsStore,
} from '../../data/settings-store';
import { NotificationDispatchService } from './notification-dispatch.service';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type CreateNotificationContext = {
  subject: string;
  body: string;
  relatedId?: string;
};

export type ScanSummary = {
  created: number;
  sent: number;
  failed: number;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly dispatchService: NotificationDispatchService) {}
  listNotificationsForTenant(tenantId: string): NotificationRecord[] {
    const store = readOperationsStore();
    return store.notifications
      .filter((n) => n.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getNotificationForTenant(
    tenantId: string,
    notificationId: string,
  ): NotificationRecord {
    const store = readOperationsStore();
    const notification = store.notifications.find(
      (n) => n.id === notificationId && n.tenantId === tenantId,
    );

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return notification;
  }

  /**
   * Fans an event out to pending notification records, one per channel that
   * the tenant has enabled for that event in Settings -> Notifications. This
   * is the single seam business flows (membership sale, payment recording,
   * expiry scans, ...) go through to raise a notification — it keeps channel
   * preference handling in one place.
   */
  async createNotificationsForEvent(
    tenantId: string,
    event: NotificationEvent,
    memberId: string,
    context: CreateNotificationContext,
  ): Promise<NotificationRecord[]> {
    const rule = this.getNotificationSettingsForTenant(tenantId)[event];

    if (!rule.enabled) {
      return [];
    }

    const channels = (
      Object.keys(rule.channels) as NotificationChannel[]
    ).filter((channel) => rule.channels[channel]);

    if (channels.length === 0) {
      return [];
    }

    const store = readOperationsStore();
    const now = new Date().toISOString();

    const created: NotificationRecord[] = channels.map((channel) => ({
      id: `notif-${randomUUID()}`,
      tenantId,
      memberId,
      channel,
      event,
      relatedId: context.relatedId,
      subject: context.subject,
      body: context.body,
      status: 'pending',
      createdAt: now,
    }));

    store.notifications.push(...created);
    writeOperationsStore(store);

    await this.dispatchService.dispatchPendingForTenant(tenantId);

    return created;
  }

  /**
   * Scans active memberships for upcoming/elapsed expiry and raises
   * `membershipExpiring` / `membershipExpired` notifications, skipping any
   * membership that has already been notified for that event. Stands in for
   * the scheduled job that would normally run this on a daily cadence.
   */
  async scanForExpiryNotifications(tenantId: string): Promise<ScanSummary> {
    const store = readOperationsStore();
    const settings = this.getNotificationSettingsForTenant(tenantId);
    const today = store.reportingDate;
    const tenantMembers = new Map(
      store.members
        .filter((member) => member.tenantId === tenantId)
        .map((member) => [member.id, member]),
    );

    const alreadyNotified = (membershipId: string, event: NotificationEvent) =>
      store.notifications.some(
        (n) =>
          n.tenantId === tenantId &&
          n.event === event &&
          n.relatedId === membershipId,
      );

    const summary: ScanSummary = { created: 0, sent: 0, failed: 0 };

    for (const membership of store.memberships) {
      const member = tenantMembers.get(membership.memberId);

      if (!member) {
        continue;
      }

      const daysUntilEnd = this.daysBetween(today, membership.endDate);

      if (
        membership.status === 'active' &&
        settings.membershipExpiring.enabled &&
        daysUntilEnd >= 0 &&
        daysUntilEnd <= settings.membershipExpiring.daysBefore &&
        !alreadyNotified(membership.id, 'membershipExpiring')
      ) {
        const notifications = await this.createNotificationsForEvent(
          tenantId,
          'membershipExpiring',
          member.id,
          {
            subject: 'Membership expiring soon',
            body: `Your membership expires on ${membership.endDate}. Renew now to keep your access.`,
            relatedId: membership.id,
          },
        );
        summary.created += notifications.length;
      }

      const isExpired = membership.status === 'expired' || daysUntilEnd < 0;

      if (
        isExpired &&
        settings.membershipExpired.enabled &&
        !alreadyNotified(membership.id, 'membershipExpired')
      ) {
        const notifications = await this.createNotificationsForEvent(
          tenantId,
          'membershipExpired',
          member.id,
          {
            subject: 'Membership expired',
            body: 'Your membership has expired. Visit the front desk to renew.',
            relatedId: membership.id,
          },
        );
        summary.created += notifications.length;
      }
    }

    return summary;
  }

  private getNotificationSettingsForTenant(tenantId: string) {
    const found = readSettingsStore().tenants.find(
      (record) => record.tenantId === tenantId,
    );

    return (
      found?.notificationSettings ??
      getDefaultTenantSettings(tenantId).notificationSettings
    );
  }

  private daysBetween(fromDate: string, toDate: string): number {
    return Math.round(
      (new Date(toDate).getTime() - new Date(fromDate).getTime()) / MS_PER_DAY,
    );
  }
}
