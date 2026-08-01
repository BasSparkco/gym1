import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { localDateString, toDateOnlyString } from '../../common/date';
import {
  getDefaultTenantSettings,
  Language,
  NotificationSettings,
} from '../../data/settings-seed';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationTemplatesService } from './notification-templates.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationChannel, NotificationEvent } from '../../generated/prisma/client';
import { NotificationTemplateKey } from '../../data/notification-templates-seed';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type CreateNotificationContext = {
  templateKey: NotificationTemplateKey;
  variables?: Record<string, string>;
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
    private readonly templatesService: NotificationTemplatesService,
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

  // Member-facing counterpart to listNotificationsForTenant: only the
  // 'app' channel rows are meant for the in-app feed (sms/whatsapp/email
  // rows are the same event delivered elsewhere, not something the app
  // should also show), and only sent ones — a still-pending row hasn't
  // actually happened for the member yet.
  async listAppNotificationsForMember(tenantId: string, memberId: string) {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
        memberId,
        channel: 'app',
        status: 'sent',
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

    const lang = await this.getTenantDefaultLanguage(tenantId);
    const { subject, body } = await this.templatesService.getRenderedTemplate(
      tenantId,
      context.templateKey,
      lang,
      context.variables ?? {},
    );

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
            subject,
            body,
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
            templateKey: 'membershipExpiring',
            variables: { endDate },
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
            templateKey: 'membershipExpired',
            relatedId: membership.id,
          },
        );
        summary.created += notifications.length;
      }
    }

    return summary;
  }

  /**
   * Scans members whose birthday (month + day) is today and raises a
   * `birthday` notification, skipping anyone already notified so far this
   * calendar year. Unlike `scanForExpiryNotifications`, dedup can't key off
   * `relatedId` pointing at a specific record (there isn't one — the
   * "related" thing is the member themself, and the same member's birthday
   * recurs every year), so it checks for an existing notification created
   * since the start of the current year instead.
   */
  async scanForBirthdays(tenantId: string): Promise<ScanSummary> {
    const settings = await this.getNotificationSettingsForTenant(tenantId);
    const summary: ScanSummary = { created: 0, sent: 0, failed: 0 };

    if (!settings.birthday.enabled) {
      return summary;
    }

    const today = localDateString();
    const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
    const startOfYear = new Date(Date.UTC(todayYear, 0, 1));

    const members = await this.prisma.member.findMany({
      where: { tenantId, dateOfBirth: { not: null } },
      select: { id: true, fullName: true, dateOfBirth: true },
    });

    for (const member of members) {
      const dob = member.dateOfBirth!;
      if (dob.getUTCMonth() + 1 !== todayMonth || dob.getUTCDate() !== todayDay) {
        continue;
      }

      const alreadyNotifiedThisYear = await this.prisma.notification.findFirst({
        where: {
          tenantId,
          event: 'birthday',
          relatedId: member.id,
          createdAt: { gte: startOfYear },
        },
      });

      if (alreadyNotifiedThisYear) {
        continue;
      }

      const notifications = await this.createNotificationsForEvent(
        tenantId,
        'birthday',
        member.id,
        {
          templateKey: 'birthday',
          variables: { memberName: member.fullName },
          relatedId: member.id,
        },
      );
      summary.created += notifications.length;
    }

    return summary;
  }

  private async getNotificationSettingsForTenant(
    tenantId: string,
  ): Promise<NotificationSettings> {
    const found = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    // Merged per-key, not swapped wholesale: a tenant provisioned before a
    // new event (e.g. `birthday`) existed has a stored JSON blob missing
    // that key entirely, so it must fall back to the default rule for that
    // one key rather than losing its other configured events.
    return {
      ...getDefaultTenantSettings(tenantId).notificationSettings,
      ...(found?.notificationSettings as unknown as Partial<NotificationSettings> | null),
    };
  }

  private async getTenantDefaultLanguage(tenantId: string): Promise<Language> {
    const found = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: { defaultLanguage: true },
    });

    return (found?.defaultLanguage as Language | undefined) ?? 'en';
  }

  private daysBetween(fromDate: string, toDate: string): number {
    return Math.round(
      (new Date(toDate).getTime() - new Date(fromDate).getTime()) / MS_PER_DAY,
    );
  }
}
