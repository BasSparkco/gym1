import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DataScopeModule } from '../../common/data-scope.module';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationsController } from './notifications.controller';
import { NotificationTemplatesController } from './notification-templates.controller';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { NotificationsService } from './notifications.service';
import { ConsoleNotificationProvider } from './providers/console-notification.provider';
import { SparkcoNotificationProvider } from './providers/sparkco-notification.provider';
import { FcmNotificationProvider } from './providers/fcm-notification.provider';

@Module({
  imports: [AuthModule, DataScopeModule],
  // NotificationTemplatesController must be registered before
  // NotificationsController: its /notifications/:notificationId route would
  // otherwise swallow /notifications/templates (Nest/Express matches routes
  // in controller-registration order).
  controllers: [NotificationTemplatesController, NotificationsController],
  providers: [
    NotificationsService,
    NotificationTemplatesService,
    NotificationDispatchService,
    NotificationsSchedulerService,
    ConsoleNotificationProvider,
    SparkcoNotificationProvider,
    FcmNotificationProvider,
  ],
  exports: [NotificationsService, FcmNotificationProvider, SparkcoNotificationProvider],
})
export class NotificationsModule {}
