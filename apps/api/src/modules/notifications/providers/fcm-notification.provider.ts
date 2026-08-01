import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import { cert, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import type {
  NotificationDeliveryInput,
  NotificationDeliveryResult,
  NotificationProvider,
} from './notification-provider.interface';

/** FCM error codes for a device token that will never work again — the app
 * was uninstalled, its token rotated, etc. Distinct from a transient failure
 * (network blip, FCM outage) worth retrying later. */
export const DEAD_TOKEN_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/**
 * Real Firebase Cloud Messaging delivery, activated once
 * FIREBASE_SERVICE_ACCOUNT_JSON (the full service-account key JSON, as a
 * single-line string) is set in the environment — same
 * configured-or-console-fallback pattern SparkcoNotificationProvider uses
 * for SPARKCO_API_KEY. Until a real Firebase project exists, this logs the
 * push instead, exactly like ConsoleNotificationProvider.
 */
@Injectable()
export class FcmNotificationProvider
  implements NotificationProvider, OnModuleInit
{
  private readonly logger = new Logger(FcmNotificationProvider.name);
  private app: App | null = null;

  onModuleInit(): void {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!raw) {
      return;
    }

    try {
      this.app = initializeApp(
        { credential: cert(JSON.parse(raw)) },
        'gym-fcm',
      );
    } catch (error) {
      this.logger.error(
        `Invalid FIREBASE_SERVICE_ACCOUNT_JSON, push notifications will be logged only: ${(error as Error).message}`,
      );
    }
  }

  async send(
    input: NotificationDeliveryInput,
  ): Promise<NotificationDeliveryResult> {
    if (!input.to) {
      return { status: 'failed', error: 'No device token to push to.' };
    }

    if (!this.app) {
      this.logger.log(`[push:stub] -> ${input.to}: ${input.subject} — ${input.body}`);
      return { status: 'sent', sentAt: new Date().toISOString() };
    }

    try {
      await getMessaging(this.app).send({
        token: input.to,
        notification: { title: input.subject, body: input.body },
      });

      return { status: 'sent', sentAt: new Date().toISOString() };
    } catch (error) {
      const code = (error as { code?: string }).code;
      const message = (error as Error).message;
      this.logger.warn(`FCM send failed -> ${input.to}: ${message}`);

      return {
        status: 'failed',
        error: code && DEAD_TOKEN_ERROR_CODES.has(code) ? code : message,
      };
    }
  }
}
