import { Module } from '@nestjs/common';
import { MessagesModule } from '../messages/messages.module';
import { SparkcoWebhookController } from './sparkco-webhook.controller';

@Module({
  imports: [MessagesModule],
  controllers: [SparkcoWebhookController],
})
export class WebhooksModule {}
