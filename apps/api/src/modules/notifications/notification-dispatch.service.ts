import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MemberRecord,
  NotificationChannel,
  NotificationRecord,
  readOperationsStore,
  writeOperationsStore,
} from '../../data/operations-store';
import {
  NotificationSenderSettings,
  getDefaultTenantSettings,
  readSettingsStore,
} from '../../data/settings-store';
import { ConsoleNotificationProvider } from './providers/console-notification.provider';
import type { NotificationProvider } from './providers/notification-provider.interface';
import { SmtpNotificationProvider } from './providers/smtp-notification.provider';
import { SparkcoNotificationProvider } from './providers/sparkco-notification.provider';

export type DispatchSummary = {
  dispatched: number;
  sent: number;
  failed: number;
};

@Injectable()
export class NotificationDispatchService {
  constructor(
    private readonly consoleProvider: ConsoleNotificationProvider,
    private readonly sparkcoProvider: SparkcoNotificationProvider,
    private readonly smtpProvider: SmtpNotificationProvider,
  ) {}

  async dispatchNotificationForTenant(
    tenantId: string,
    notificationId: string,
  ): Promise<NotificationRecord> {
    const store = readOperationsStore();
    const idx = store.notifications.findIndex(
      (n) => n.id === notificationId && n.tenantId === tenantId,
    );

    if (idx === -1) {
      throw new NotFoundException('Notification not found.');
    }

    if (store.notifications[idx].status !== 'pending') {
      throw new BadRequestException(
        'Only pending notifications can be dispatched.',
      );
    }

    const member = store.members.find(
      (m) =>
        m.id === store.notifications[idx].memberId && m.tenantId === tenantId,
    );
    const senders = this.getNotificationSendersForTenant(tenantId);

    const updated = await this.deliver(
      store.notifications[idx],
      member,
      senders,
    );
    store.notifications[idx] = updated;
    writeOperationsStore(store);

    return updated;
  }

  async dispatchPendingForTenant(tenantId: string): Promise<DispatchSummary> {
    const store = readOperationsStore();
    const memberMap = new Map(
      store.members
        .filter((m) => m.tenantId === tenantId)
        .map((m) => [m.id, m]),
    );
    const senders = this.getNotificationSendersForTenant(tenantId);

    const summary: DispatchSummary = { dispatched: 0, sent: 0, failed: 0 };

    for (let i = 0; i < store.notifications.length; i += 1) {
      const notification = store.notifications[i];

      if (
        notification.tenantId !== tenantId ||
        notification.status !== 'pending'
      ) {
        continue;
      }

      const updated = await this.deliver(
        notification,
        memberMap.get(notification.memberId),
        senders,
      );
      store.notifications[i] = updated;
      summary.dispatched += 1;
      summary[updated.status === 'sent' ? 'sent' : 'failed'] += 1;
    }

    writeOperationsStore(store);

    return summary;
  }

  private async deliver(
    notification: NotificationRecord,
    member: MemberRecord | undefined,
    senders: NotificationSenderSettings,
  ): Promise<NotificationRecord> {
    const to = this.resolveAddress(notification.channel, member);

    if (!to) {
      return { ...notification, status: 'failed', failedReason: 'No contact address on file for this member.' };
    }

    const provider = this.selectProvider(notification.channel);
    const result = await provider.send({
      channel: notification.channel,
      to,
      from: notification.channel === 'email' ? senders.emailFrom : undefined,
      subject: notification.subject,
      body: notification.body,
    });

    return result.status === 'sent'
      ? { ...notification, status: 'sent', sentAt: result.sentAt, failedReason: undefined }
      : { ...notification, status: 'failed', failedReason: result.error };
  }

  private selectProvider(channel: NotificationChannel): NotificationProvider {
    if (channel === 'email') {
      const hasSmtp = !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD
      );
      return hasSmtp ? this.smtpProvider : this.consoleProvider;
    }

    if (channel === 'whatsapp') {
      return process.env.SPARKCO_API_KEY
        ? this.sparkcoProvider
        : this.consoleProvider;
    }

    // SMS: reserved for future paid tier — falls back to console for now
    return this.consoleProvider;
  }

  private resolveAddress(
    channel: NotificationChannel,
    member: MemberRecord | undefined,
  ): string | undefined {
    if (!member) {
      return undefined;
    }

    return channel === 'email' ? member.email : member.phone;
  }

  private getNotificationSendersForTenant(
    tenantId: string,
  ): NotificationSenderSettings {
    const found = readSettingsStore().tenants.find(
      (record) => record.tenantId === tenantId,
    );

    return (
      found?.notificationSenders ??
      getDefaultTenantSettings(tenantId).notificationSenders
    );
  }
}
