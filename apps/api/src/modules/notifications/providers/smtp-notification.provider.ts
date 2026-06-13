import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import type {
  NotificationDeliveryInput,
  NotificationDeliveryResult,
  NotificationProvider,
} from './notification-provider.interface';

/**
 * Real email delivery via SMTP (works for SendGrid, Mailgun, Gmail SMTP relay,
 * or any standard SMTP server). Selected by NotificationsModule's provider
 * factory in place of ConsoleNotificationProvider once SMTP_HOST / SMTP_USER /
 * SMTP_PASSWORD are present in the environment — nothing else in the dispatch
 * pipeline changes.
 */
@Injectable()
export class SmtpNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(SmtpNotificationProvider.name);
  private transporter: Transporter | undefined;

  async send(
    input: NotificationDeliveryInput,
  ): Promise<NotificationDeliveryResult> {
    const transporter = this.getTransporter();

    if (!transporter) {
      return {
        status: 'failed',
        error:
          'SMTP is not configured (set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD).',
      };
    }

    if (!input.from) {
      return {
        status: 'failed',
        error:
          'No email sender address is configured in Settings -> Notifications -> Sender identities.',
      };
    }

    try {
      await transporter.sendMail({
        from: input.from,
        to: input.to,
        subject: input.subject,
        text: input.body,
      });

      return { status: 'sent', sentAt: new Date().toISOString() };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.warn(`SMTP send failed for email -> ${input.to}: ${message}`);
      return { status: 'failed', error: message };
    }
  }

  private getTransporter(): Transporter | undefined {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      return undefined;
    }

    const port = Number(process.env.SMTP_PORT ?? '587');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });

    return this.transporter;
  }
}
