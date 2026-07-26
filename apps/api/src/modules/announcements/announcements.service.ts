import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { FcmNotificationProvider } from '../notifications/providers/fcm-notification.provider';
import { Announcement } from '../../generated/prisma/client';

type CreateAnnouncementInput = {
  branchId?: string;
  title?: string;
  body?: string;
};

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmProvider: FcmNotificationProvider,
  ) {}

  async listForTenant(tenantId: string, scopedBranchId?: string) {
    const announcements = await this.prisma.announcement.findMany({
      where: {
        tenantId,
        ...(scopedBranchId
          ? { OR: [{ branchId: null }, { branchId: scopedBranchId }] }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return announcements;
  }

  async listForMember(tenantId: string, homeBranchId: string) {
    return this.prisma.announcement.findMany({
      where: {
        tenantId,
        OR: [{ branchId: null }, { branchId: homeBranchId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, input: CreateAnnouncementInput) {
    const title = input.title?.trim();
    const body = input.body?.trim();

    if (!title || !body) {
      throw new BadRequestException('Title and body are required.');
    }

    if (input.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: input.branchId, tenantId },
      });
      if (!branch) {
        throw new BadRequestException('Branch is invalid for this tenant.');
      }
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        id: `announcement-${randomUUID()}`,
        tenantId,
        branchId: input.branchId ?? null,
        title,
        body,
      },
    });

    const { sent, failed } = await this.sendPush(
      tenantId,
      input.branchId,
      title,
      body,
    );

    return this.prisma.announcement.update({
      where: { id: announcement.id },
      data: { pushSentCount: sent, pushFailedCount: failed },
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const current = await this.prisma.announcement.findFirst({
      where: { id, tenantId },
    });

    if (!current) {
      throw new NotFoundException('Announcement not found.');
    }

    await this.prisma.announcement.delete({ where: { id } });
  }

  // Fire-and-log push to every device token belonging to a member this
  // announcement applies to (tenant-wide when branchId is undefined,
  // otherwise just that branch's members). No per-recipient row is kept —
  // only the aggregate counts cached on the Announcement itself.
  private async sendPush(
    tenantId: string,
    branchId: string | undefined,
    title: string,
    body: string,
  ): Promise<{ sent: number; failed: number }> {
    const tokens = await this.prisma.memberDeviceToken.findMany({
      where: {
        member: {
          tenantId,
          ...(branchId ? { homeBranchId: branchId } : {}),
        },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const token of tokens) {
      const result = await this.fcmProvider.send({
        channel: 'push',
        to: token.token,
        subject: title,
        body,
      });
      if (result.status === 'sent') {
        sent += 1;
      } else {
        failed += 1;
      }
    }

    return { sent, failed };
  }
}

// Re-exported so the controller can type responses without reaching into
// the generated client directly.
export type { Announcement };
