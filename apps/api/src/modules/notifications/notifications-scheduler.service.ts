import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { readOperationsStore } from '../../data/operations-store';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger(NotificationsSchedulerService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async runDailyNotificationCycle(): Promise<void> {
    for (const tenantId of this.listTenantIds()) {
      try {
        const result =
          await this.notificationsService.scanForExpiryNotifications(tenantId);

        this.logger.log(
          `[${tenantId}] scan raised ${result.created} notification(s); ` +
            `sent ${result.sent} (${result.failed} failed).`,
        );
      } catch (error) {
        this.logger.error(
          `[${tenantId}] daily notification cycle failed: ${(error as Error).message}`,
        );
      }
    }
  }

  private listTenantIds(): string[] {
    const store = readOperationsStore();
    return [...new Set(store.members.map((member) => member.tenantId))];
  }
}
