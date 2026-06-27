import { Injectable, Logger } from '@nestjs/common';
import type {
  NotificationDeliveryInput,
  NotificationDeliveryResult,
  NotificationProvider,
} from './notification-provider.interface';

/**
 * Real WhatsApp delivery via the SparkCo communication service
 * (api.sparkco.vip). Activated when SPARKCO_API_KEY is set in the environment.
 * SPARKCO_API_URL can override the base URL (defaults to production).
 */
@Injectable()
export class SparkcoNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(SparkcoNotificationProvider.name);

  async send(
    input: NotificationDeliveryInput,
  ): Promise<NotificationDeliveryResult> {
    const apiKey = process.env.SPARKCO_API_KEY;
    const baseUrl =
      process.env.SPARKCO_API_URL ?? 'https://api.sparkco.vip/api/v1';

    if (!apiKey) {
      return {
        status: 'failed',
        error: 'SparkCo is not configured (set SPARKCO_API_KEY).',
      };
    }

    const payload: Record<string, string> = {
      channel: input.channel,
      to: input.to,
      message: input.body,
    };

    if (input.channel === 'email' && input.subject) {
      payload.subject = input.subject;
    }

    if (input.channel === 'whatsapp' && input.sessionId) {
      payload.sessionId = input.sessionId;
    }

    try {
      const response = await fetch(`${baseUrl}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`SparkCo API error ${response.status}: ${text}`);
      }

      return { status: 'sent', sentAt: new Date().toISOString() };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.warn(
        `SparkCo send failed for ${input.channel} -> ${input.to}: ${message}`,
      );
      return { status: 'failed', error: message };
    }
  }
}
