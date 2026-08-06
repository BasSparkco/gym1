import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { SparkcoWebhookGuard } from './sparkco-webhook.guard';

// Payload shape per COMMUNICATION_SERVICE_MANUAL.md's "Webhooks (real-time
// notifications)" section. `body` is only present on `message.received`.
type SparkcoWebhookPayload = {
  event:
    | 'message.received'
    | 'message.sent'
    | 'message.failed'
    | 'message.delivered';
  messageId: string;
  channel: 'email' | 'whatsapp';
  to: string;
  status: string;
  direction: 'inbound' | 'outbound';
  body?: string;
  errorMessage?: string;
  tenantId: string;
  timestamp: string;
};

/**
 * Receives real-time delivery/reply events from the SparkCo communication
 * service (see COMMUNICATION_SERVICE_MANUAL.md). Register this URL once via
 * `register-sparkco-webhook.ts` — see that script for the one-time setup.
 *
 * Configured on SparkCo: https://<domain>/api/webhooks/sparkco
 */
@Controller('webhooks')
export class SparkcoWebhookController {
  private readonly logger = new Logger(SparkcoWebhookController.name);

  constructor(private readonly messagesService: MessagesService) {}

  @Post('sparkco')
  @HttpCode(200)
  @UseGuards(SparkcoWebhookGuard)
  async handle(@Body() payload: SparkcoWebhookPayload) {
    // Only message.received (a member's WhatsApp reply) needs handling
    // right now — the webhook is registered with events: ['message.received']
    // only, so other event types shouldn't normally arrive, but ack them
    // rather than error if SparkCo ever sends one anyway.
    if (
      payload.event !== 'message.received' ||
      payload.channel !== 'whatsapp'
    ) {
      return { received: true };
    }

    if (!payload.body) {
      this.logger.warn(
        `message.received from ${payload.to} had no body — dropped.`,
      );
      return { received: true };
    }

    await this.messagesService.receiveInboundWhatsApp(payload.to, payload.body);
    return { received: true };
  }
}
