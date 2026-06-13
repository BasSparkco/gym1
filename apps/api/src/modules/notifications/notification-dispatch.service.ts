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
  MessagingProvider,
  NotificationSenderSettings,
  getDefaultTenantSettings,
  readSettingsStore,
} from '../../data/settings-store';
import { ConsoleNotificationProvider } from './providers/console-notification.provider';
import type { NotificationProvider } from './providers/notification-provider.interface';
import { SentdmNotificationProvider } from './providers/sentdm-notification.provider';
import { SmtpNotificationProvider } from './providers/smtp-notification.provider';
import { TwilioNotificationProvider } from './providers/twilio-notification.provider';

export type DispatchSummary = {
  dispatched: number;
  sent: number;
  failed: number;
};

@Injectable()
export class NotificationDispatchService {
  constructor(
    private readonly consoleProvider: ConsoleNotificationProvider,
    private readonly twilioProvider: TwilioNotificationProvider,
    private readonly sentdmProvider: SentdmNotificationProvider,
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

    const provider = this.selectProvider(notification.channel, senders);
    const result = await provider.send({
      channel: notification.channel,
      to,
      from: this.resolveFrom(notification.channel, senders),
      subject: notification.subject,
      body: notification.body,
      providerOptions: {
        sentdmTemplateName: senders.sentdmTemplateName,
      },
    });

    return result.status === 'sent'
      ? { ...notification, status: 'sent', sentAt: result.sentAt, failedReason: undefined }
      : { ...notification, status: 'failed', failedReason: result.error };
  }

  private selectProvider(
    channel: NotificationChannel,
    senders: NotificationSenderSettings,
  ): NotificationProvider {
    if (channel === 'email') {
      const hasSmtp = !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD
      );
      return hasSmtp ? this.smtpProvider : this.consoleProvider;
    }

    const chosen: MessagingProvider = senders.messagingProvider ?? 'console';

    if (chosen === 'twilio') {
      const hasTwilio = !!(
        process.env.TWILIO_ACCOUNT_SID &&
        (process.env.TWILIO_AUTH_TOKEN ||
          (process.env.TWILIO_API_KEY && process.env.TWILIO_API_KEY_SECRET))
      );
      return hasTwilio ? this.twilioProvider : this.consoleProvider;
    }

    if (chosen === 'sentdm') {
      return process.env.SENT_DM_API_KEY
        ? this.sentdmProvider
        : this.consoleProvider;
    }

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

  private resolveFrom(
    channel: NotificationChannel,
    senders: NotificationSenderSettings,
  ): string | undefined {
    switch (channel) {
      case 'sms':
        return senders.smsFrom;
      case 'whatsapp':
        return senders.whatsappFrom;
      case 'email':
        return senders.emailFrom;
    }
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
