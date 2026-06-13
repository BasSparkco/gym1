import { Injectable, Logger } from '@nestjs/common';
import SentDm from '@sentdm/sentdm';
import type {
  NotificationDeliveryInput,
  NotificationDeliveryResult,
  NotificationProvider,
} from './notification-provider.interface';

@Injectable()
export class SentdmNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(SentdmNotificationProvider.name);
  private client: SentDm | undefined;

  async send(
    input: NotificationDeliveryInput,
  ): Promise<NotificationDeliveryResult> {
    const client = this.getClient();

    if (!client) {
      return {
        status: 'failed',
        error: 'Sent.dm is not configured (set SENT_DM_API_KEY).',
      };
    }

    const templateName =
      input.providerOptions?.sentdmTemplateName || 'notification';
    const channel: ('sms' | 'whatsapp')[] =
      input.channel === 'whatsapp' ? ['whatsapp'] : ['sms'];

    try {
      await client.messages.send({
        to: [input.to],
        channel,
        template: {
          name: templateName,
          parameters: { body: input.body },
        },
      });

      return { status: 'sent', sentAt: new Date().toISOString() };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.warn(
        `Sent.dm send failed for ${input.channel} -> ${input.to}: ${message}`,
      );
      return { status: 'failed', error: message };
    }
  }

  private getClient(): SentDm | undefined {
    if (this.client) {
      return this.client;
    }

    const apiKey = process.env.SENT_DM_API_KEY;

    if (!apiKey) {
      return undefined;
    }

    this.client = new SentDm({ apiKey });
    return this.client;
  }
}
