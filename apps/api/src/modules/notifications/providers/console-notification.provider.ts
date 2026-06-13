import { Injectable, Logger } from '@nestjs/common';
import type {
  NotificationDeliveryInput,
  NotificationDeliveryResult,
  NotificationProvider,
} from './notification-provider.interface';

/**
 * Pilot/dev stand-in for a real delivery backend: it "sends" by logging the
 * message instead of calling out to SMS/WhatsApp/email APIs. This keeps the
 * notification pipeline (creation -> dispatch -> status update) fully
 * exercisable without provider credentials, and gives real providers a
 * drop-in replacement target with the same interface.
 */
@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(ConsoleNotificationProvider.name);

  send(input: NotificationDeliveryInput): Promise<NotificationDeliveryResult> {
    if (!input.to) {
      return Promise.resolve({
        status: 'failed',
        error: `Member has no ${input.channel} contact address on file.`,
      });
    }

    this.logger.log(
      `[${input.channel}] -> ${input.to}: ${input.subject} — ${input.body}`,
    );

    return Promise.resolve({
      status: 'sent',
      sentAt: new Date().toISOString(),
    });
  }
}
