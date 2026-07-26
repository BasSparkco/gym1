import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DataScopeModule } from '../../common/data-scope.module';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { NotificationsService } from './notifications.service';
import { ConsoleNotificationProvider } from './providers/console-notification.provider';
import { SparkcoNotificationProvider } from './providers/sparkco-notification.provider';
import { FcmNotificationProvider } from './providers/fcm-notification.provider';

@Module({
  imports: [AuthModule, DataScopeModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDispatchService,
    NotificationsSchedulerService,
    ConsoleNotificationProvider,
    SparkcoNotificationProvider,
    FcmNotificationProvider,
  ],
  exports: [NotificationsService, FcmNotificationProvider],
})
export class NotificationsModule {}
