import type { NotificationChannel } from '../../../data/operations-store';

export type NotificationDeliveryInput = {
  channel: NotificationChannel;
  to: string;
  /** Sender identity for the channel (Twilio "from" number / email address). Not used by Sent.dm. */
  from?: string;
  subject: string;
  body: string;
  /** Provider-specific options threaded from tenant settings. */
  providerOptions?: {
    sentdmTemplateName?: string;
  };
};

export type NotificationDeliveryResult =
  | { status: 'sent'; sentAt: string }
  | { status: 'failed'; error: string };

export interface NotificationProvider {
  send(input: NotificationDeliveryInput): Promise<NotificationDeliveryResult>;
}
