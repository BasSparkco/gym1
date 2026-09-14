import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MinioService } from '../../minio/minio.service';

const RETENTION_DAYS = 7;

@Injectable()
export class InbodyCaptureCleanupService {
  private readonly logger = new Logger(InbodyCaptureCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async purgeExpiredCaptures(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const expired = await this.prisma.inbodyCaptureRequest.findMany({
      where: { receivedAt: { lt: cutoff } },
      select: { id: true, tenantId: true, objectKey: true, bodyLength: true },
    });
    if (expired.length === 0) return;

    for (const row of expired) {
      if (row.objectKey) {
        try {
          await this.minio.client.removeObject(this.minio.getBucket(), row.objectKey);
        } catch (err) {
          this.logger.error(`Failed to remove capture object ${row.objectKey}: ${(err as Error).message}`);
          continue; // leave the DB row (and its byte count) so we retry tomorrow
        }
      }

      await this.prisma.$transaction([
        this.prisma.inbodyCaptureRequest.delete({ where: { id: row.id } }),
        ...(row.objectKey
          ? [
              this.prisma.inbodyCapture.update({
                where: { tenantId: row.tenantId },
                data: { totalBytes: { decrement: row.bodyLength } },
              }),
            ]
          : []),
      ]);
    }

    this.logger.log(`inbody-capture retention cleanup purged ${expired.length} request(s) older than ${RETENTION_DAYS} days.`);
  }
}
