import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { NotificationsService } from './notifications.service';
import { ConsoleNotificationProvider } from './providers/console-notification.provider';
import { SmtpNotificationProvider } from './providers/smtp-notification.provider';
import { SparkcoNotificationProvider } from './providers/sparkco-notification.provider';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDispatchService,
    NotificationsSchedulerService,
    ConsoleNotificationProvider,
    SparkcoNotificationProvider,
    SmtpNotificationProvider,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
