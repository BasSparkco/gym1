import { Injectable, Logger } from '@nestjs/common';
import type {
  NotificationDeliveryInput,
  NotificationDeliveryResult,
  NotificationProvider,
} from './notification-provider.interface';

/**
 * Stand-in for real Firebase Cloud Messaging delivery — no Firebase project
 * exists yet, so this logs the push instead of calling the FCM API, exactly
 * like ConsoleNotificationProvider stands in for SMS/WhatsApp/email. Once a
 * real Firebase service account is available, swap the body of `send` for an
 * actual `firebase-admin` call gated on the same env-var-presence pattern
 * SparkcoNotificationProvider/SmtpNotificationProvider already use — no
 * interface or call-site changes needed elsewhere.
 */
@Injectable()
export class FcmNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(FcmNotificationProvider.name);

  send(input: NotificationDeliveryInput): Promise<NotificationDeliveryResult> {
    if (!input.to) {
      return Promise.resolve({
        status: 'failed',
        error: 'No device token to push to.',
      });
    }

    this.logger.log(`[push] -> ${input.to}: ${input.subject} — ${input.body}`);

    return Promise.resolve({
      status: 'sent',
      sentAt: new Date().toISOString(),
    });
  }
}
