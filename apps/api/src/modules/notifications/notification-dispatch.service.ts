import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { getDefaultTenantSettings, NotificationSenderSettings } from '../../data/settings-seed';
import { ConsoleNotificationProvider } from './providers/console-notification.provider';
import type { NotificationProvider } from './providers/notification-provider.interface';
import { SparkcoNotificationProvider } from './providers/sparkco-notification.provider';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Member,
  Notification,
  NotificationChannel,
} from '../../generated/prisma/client';

export type DispatchSummary = {
  dispatched: number;
  sent: number;
  failed: number;
};

@Injectable()
export class NotificationDispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consoleProvider: ConsoleNotificationProvider,
    private readonly sparkcoProvider: SparkcoNotificationProvider,
  ) {}

  async dispatchNotificationForTenant(
    tenantId: string,
    notificationId: string,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, tenantId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (notification.status !== 'pending') {
      throw new BadRequestException(
        'Only pending notifications can be dispatched.',
      );
    }

    const member = await this.prisma.member.findFirst({
      where: { id: notification.memberId, tenantId },
    });
    const senders = await this.getNotificationSendersForTenant(tenantId);

    return this.deliver(notification, member, senders);
  }

  async dispatchPendingForTenant(tenantId: string): Promise<DispatchSummary> {
    const pending = await this.prisma.notification.findMany({
      where: { tenantId, status: 'pending' },
    });
    const senders = await this.getNotificationSendersForTenant(tenantId);

    const summary: DispatchSummary = { dispatched: 0, sent: 0, failed: 0 };

    for (const notification of pending) {
      const member = await this.prisma.member.findFirst({
        where: { id: notification.memberId, tenantId },
      });

      const updated = await this.deliver(notification, member, senders);
      summary.dispatched += 1;
      summary[updated.status === 'sent' ? 'sent' : 'failed'] += 1;
    }

    return summary;
  }

  private async deliver(
    notification: Notification,
    member: Member | null,
    senders: NotificationSenderSettings,
  ): Promise<Notification> {
    const to = this.resolveAddress(notification.channel, member);

    if (!to) {
      return this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
          failedReason: 'No contact address on file for this member.',
        },
      });
    }

    if (notification.channel === 'whatsapp' && !to.startsWith('+')) {
      return this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
          failedReason: `Phone number "${to}" is missing a country code. Edit the member's profile and set the correct international number (e.g. +970515622300).`,
        },
      });
    }

    const provider = this.selectProvider(notification.channel);
    const result = await provider.send({
      channel: notification.channel,
      to,
      from: notification.channel === 'email' ? senders.emailFrom : undefined,
      subject: notification.subject,
      body: notification.body,
      sessionId: notification.channel === 'whatsapp' ? member?.homeBranchId : undefined,
    });

    return result.status === 'sent'
      ? this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'sent',
            sentAt: new Date(result.sentAt),
            failedReason: null,
          },
        })
      : this.prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'failed', failedReason: result.error },
        });
  }

  private selectProvider(channel: NotificationChannel): NotificationProvider {
    if (channel === 'email' || channel === 'whatsapp') {
      return process.env.SPARKCO_API_KEY
        ? this.sparkcoProvider
        : this.consoleProvider;
    }

    // SMS: reserved for future paid tier — falls back to console for now
    return this.consoleProvider;
  }

  private resolveAddress(
    channel: NotificationChannel,
    member: Member | null,
  ): string | undefined {
    if (!member) {
      return undefined;
    }

    return (channel === 'email' ? member.email : member.phone) ?? undefined;
  }

  private async getNotificationSendersForTenant(
    tenantId: string,
  ): Promise<NotificationSenderSettings> {
    const found = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    return (
      (found?.notificationSenders as unknown as NotificationSenderSettings) ??
      getDefaultTenantSettings(tenantId).notificationSenders
    );
  }
}
