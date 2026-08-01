import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger(NotificationsSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async runDailyNotificationCycle(): Promise<void> {
    for (const tenantId of await this.listTenantIds()) {
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

      try {
        const result =
          await this.notificationsService.scanForBirthdays(tenantId);

        this.logger.log(
          `[${tenantId}] birthday scan raised ${result.created} notification(s); ` +
            `sent ${result.sent} (${result.failed} failed).`,
        );
      } catch (error) {
        this.logger.error(
          `[${tenantId}] birthday scan failed: ${(error as Error).message}`,
        );
      }
    }
  }

  private async listTenantIds(): Promise<string[]> {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
    return tenants.map((t) => t.id);
  }
}
