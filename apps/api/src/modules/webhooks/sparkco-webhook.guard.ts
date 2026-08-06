import {
  CanActivate,
  ExecutionContext,
  Injectable,
  RawBodyRequest,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/**
 * Verifies the `X-Webhook-Signature: sha256=<hex hmac>` header the SparkCo
 * communication service sends on every webhook delivery, per
 * COMMUNICATION_SERVICE_MANUAL.md. The HMAC is computed over the raw request
 * bytes, not the parsed/re-serialized body, so this relies on
 * `req.rawBody` (populated by `NestFactory.create(AppModule, { rawBody: true })`
 * in main.ts).
 */
@Injectable()
export class SparkcoWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RawBodyRequest<Request>>();
    const secret = process.env.SPARKCO_WEBHOOK_SECRET;

    if (!secret) {
      throw new UnauthorizedException(
        'SparkCo webhook secret is not configured.',
      );
    }

    const signatureHeader = request.headers['x-webhook-signature'];
    const rawBody = request.rawBody;
    if (typeof signatureHeader !== 'string' || !rawBody) {
      throw new UnauthorizedException('Missing webhook signature.');
    }

    const expected =
      'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
    const provided = Buffer.from(signatureHeader);
    const expectedBuffer = Buffer.from(expected);

    if (
      provided.length !== expectedBuffer.length ||
      !timingSafeEqual(provided, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    return true;
  }
}
