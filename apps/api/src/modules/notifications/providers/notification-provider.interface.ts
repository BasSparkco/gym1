import type { NotificationChannel } from '../../../data/operations-store';

export type NotificationDeliveryInput = {
  channel: NotificationChannel;
  to: string;
  /** Sender address for email (the "from" field shown to recipients). Not used for WhatsApp. */
  from?: string;
  subject: string;
  body: string;
  /** Branch/session identifier — routes WhatsApp messages to the correct per-branch session. */
  sessionId?: string;
};

export type NotificationDeliveryResult =
  | { status: 'sent'; sentAt: string }
  | { status: 'failed'; error: string };

export interface NotificationProvider {
  send(input: NotificationDeliveryInput): Promise<NotificationDeliveryResult>;
}
