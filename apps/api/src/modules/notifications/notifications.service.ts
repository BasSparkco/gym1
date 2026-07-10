import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { localDateString, toDateOnlyString } from '../../common/date';
import { getDefaultTenantSettings, NotificationSettings } from '../../data/settings-seed';
import { NotificationDispatchService } from './notification-dispatch.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationChannel, NotificationEvent } from '../../generated/prisma/client';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchService: NotificationDispatchService,
  ) {}

  async listNotificationsForTenant(tenantId: string, branchId?: string) {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
        ...(branchId ? { member: { homeBranchId: branchId } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNotificationForTenant(tenantId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, tenantId },
    });

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
  ) {
    const rule = (await this.getNotificationSettingsForTenant(tenantId))[
      event
    ];

    if (!rule.enabled) {
      return [];
    }

    const channels = (
      Object.keys(rule.channels) as NotificationChannel[]
    ).filter((channel) => rule.channels[channel]);

    if (channels.length === 0) {
      return [];
    }

    const created = await Promise.all(
      channels.map((channel) =>
        this.prisma.notification.create({
          data: {
            id: `notif-${randomUUID()}`,
            tenantId,
            memberId,
            channel,
            event,
            relatedId: context.relatedId,
            subject: context.subject,
            body: context.body,
            status: 'pending' as const,
          },
        }),
      ),
    );

    await this.dispatchService.dispatchPendingForTenant(tenantId);

    return this.prisma.notification.findMany({
      where: { id: { in: created.map((n) => n.id) } },
    });
  }

  /**
   * Scans active memberships for upcoming/elapsed expiry and raises
   * `membershipExpiring` / `membershipExpired` notifications, skipping any
   * membership that has already been notified for that event. Stands in for
   * the scheduled job that would normally run this on a daily cadence.
   */
  async scanForExpiryNotifications(tenantId: string): Promise<ScanSummary> {
    const settings = await this.getNotificationSettingsForTenant(tenantId);
    const today = localDateString();

    const memberships = await this.prisma.membership.findMany({
      where: { member: { tenantId } },
      include: { member: true },
    });

    const alreadyNotified = async (
      membershipId: string,
      event: NotificationEvent,
    ) => {
      const existing = await this.prisma.notification.findFirst({
        where: { tenantId, event, relatedId: membershipId },
      });
      return existing !== null;
    };

    const summary: ScanSummary = { created: 0, sent: 0, failed: 0 };

    for (const membership of memberships) {
      const member = membership.member;
      const endDate = toDateOnlyString(membership.endDate);
      const daysUntilEnd = this.daysBetween(today, endDate);

      if (
        membership.status === 'active' &&
        settings.membershipExpiring.enabled &&
        daysUntilEnd >= 0 &&
        daysUntilEnd <= settings.membershipExpiring.daysBefore &&
        !(await alreadyNotified(membership.id, 'membershipExpiring'))
      ) {
        const notifications = await this.createNotificationsForEvent(
          tenantId,
          'membershipExpiring',
          member.id,
          {
            subject: 'Membership expiring soon',
            body: `Your membership expires on ${endDate}. Renew now to keep your access.`,
            relatedId: membership.id,
          },
        );
        summary.created += notifications.length;
      }

      const isExpired = membership.status === 'expired' || daysUntilEnd < 0;

      if (
        isExpired &&
        settings.membershipExpired.enabled &&
        !(await alreadyNotified(membership.id, 'membershipExpired'))
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

  private async getNotificationSettingsForTenant(
    tenantId: string,
  ): Promise<NotificationSettings> {
    const found = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    return (
      (found?.notificationSettings as unknown as NotificationSettings) ??
      getDefaultTenantSettings(tenantId).notificationSettings
    );
  }

  private daysBetween(fromDate: string, toDate: string): number {
    return Math.round(
      (new Date(toDate).getTime() - new Date(fromDate).getTime()) / MS_PER_DAY,
    );
  }
}
