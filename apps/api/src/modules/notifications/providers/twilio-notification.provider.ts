import { Injectable, Logger } from '@nestjs/common';
import twilio, { Twilio } from 'twilio';
import type {
  NotificationDeliveryInput,
  NotificationDeliveryResult,
  NotificationProvider,
} from './notification-provider.interface';

/**
 * Real SMS/WhatsApp delivery via Twilio. Selected by NotificationsModule's
 * provider factory in place of ConsoleNotificationProvider once
 * TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are present in the environment —
 * nothing else in the dispatch pipeline changes.
 *
 * WhatsApp messages route through the same Twilio API as SMS, but both the
 * sender and recipient numbers must carry the `whatsapp:` channel prefix.
 */
@Injectable()
export class TwilioNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(TwilioNotificationProvider.name);
  private client: Twilio | undefined;

  async send(
    input: NotificationDeliveryInput,
  ): Promise<NotificationDeliveryResult> {
    const client = this.getClient();

    if (!client) {
      return {
        status: 'failed',
        error:
          'Twilio is not configured (set TWILIO_ACCOUNT_SID with either TWILIO_API_KEY + TWILIO_API_KEY_SECRET, or TWILIO_AUTH_TOKEN).',
      };
    }

    if (!input.from) {
      return {
        status: 'failed',
        error: `No ${input.channel} sender number is configured in Settings -> Notifications -> Sender identities.`,
      };
    }

    const prefix = input.channel === 'whatsapp' ? 'whatsapp:' : '';
    const from = this.toE164(input.from);
    const to = this.toE164(input.to);

    try {
      await client.messages.create({
        from: `${prefix}${from}`,
        to: `${prefix}${to}`,
        body: input.body,
      });

      return { status: 'sent', sentAt: new Date().toISOString() };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.warn(
        `Twilio send failed for ${input.channel} -> ${input.to}: ${message}`,
      );
      return { status: 'failed', error: message };
    }
  }

  private toE164(number: string): string {
    const digits = number.replace(/[^\d+]/g, '');
    return digits.startsWith('+') ? digits : `+${digits}`;
  }

  private getClient(): Twilio | undefined {
    if (this.client) {
      return this.client;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid) {
      return undefined;
    }

    if (apiKey && apiKeySecret) {
      // API Key auth (recommended): TWILIO_ACCOUNT_SID + TWILIO_API_KEY + TWILIO_API_KEY_SECRET
      this.client = twilio(apiKey, apiKeySecret, { accountSid });
    } else if (authToken) {
      // Auth Token fallback: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN
      this.client = twilio(accountSid, authToken);
    } else {
      return undefined;
    }

    return this.client;
  }
}
