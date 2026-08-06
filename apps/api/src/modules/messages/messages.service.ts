import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { SparkcoNotificationProvider } from '../notifications/providers/sparkco-notification.provider';
import { Message } from '../../generated/prisma/client';

const phoneDigits = (phone: string) =>
  phone.replace(/\D/g, '').replace(/^0+/, '');

export type ConversationSummary = {
  memberId: string;
  memberName: string;
  memberNumber: string;
  lastMessageBody: string;
  lastMessageAt: Date;
  unreadCount: number;
};

export type WhatsAppDeliveryResult = { sent: boolean; reason?: string };

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sparkcoProvider: SparkcoNotificationProvider,
  ) {}

  // One row per member with at least one message: last message preview plus
  // how many of the member's messages staff hasn't read yet. Built in JS
  // rather than a groupBy since Prisma's groupBy can't join in the member
  // name/number a table row also needs — fine at this data volume.
  async listConversationsForTenant(
    tenantId: string,
    branchId?: string,
  ): Promise<ConversationSummary[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        tenantId,
        ...(branchId ? { member: { homeBranchId: branchId } } : {}),
      },
      include: {
        member: { select: { fullName: true, memberNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byMember = new Map<string, ConversationSummary>();
    for (const message of messages) {
      let entry = byMember.get(message.memberId);
      if (!entry) {
        entry = {
          memberId: message.memberId,
          memberName: message.member.fullName,
          memberNumber: message.member.memberNumber,
          lastMessageBody: message.body,
          lastMessageAt: message.createdAt,
          unreadCount: 0,
        };
        byMember.set(message.memberId, entry);
      }
      if (message.senderType === 'member' && !message.readByStaffAt) {
        entry.unreadCount += 1;
      }
    }

    return Array.from(byMember.values());
  }

  async countUnreadForTenant(
    tenantId: string,
    branchId?: string,
  ): Promise<number> {
    return this.prisma.message.count({
      where: {
        tenantId,
        senderType: 'member',
        readByStaffAt: null,
        ...(branchId ? { member: { homeBranchId: branchId } } : {}),
      },
    });
  }

  async getThreadForStaff(
    tenantId: string,
    branchId: string | undefined,
    memberId: string,
  ) {
    await this.requireMemberInScope(tenantId, branchId, memberId);

    const messages = await this.prisma.message.findMany({
      where: { tenantId, memberId },
      orderBy: { createdAt: 'asc' },
    });

    await this.prisma.message.updateMany({
      where: { tenantId, memberId, senderType: 'member', readByStaffAt: null },
      data: { readByStaffAt: new Date() },
    });

    return messages;
  }

  async sendFromStaff(
    tenantId: string,
    branchId: string | undefined,
    memberId: string,
    userId: string,
    body: string | undefined,
  ): Promise<{ message: Message; whatsapp: WhatsAppDeliveryResult }> {
    const member = await this.requireMemberInScope(
      tenantId,
      branchId,
      memberId,
    );
    const trimmed = body?.trim();
    if (!trimmed) {
      throw new BadRequestException('Message body is required.');
    }

    const message = await this.prisma.message.create({
      data: {
        id: `message-${randomUUID()}`,
        tenantId,
        memberId,
        senderType: 'staff',
        senderUserId: userId,
        body: trimmed,
        readByStaffAt: new Date(),
      },
    });

    const whatsapp = await this.sendViaWhatsApp(member, trimmed);

    return { message, whatsapp };
  }

  // Staff messages are delivered to the member over WhatsApp (members reply
  // in their own WhatsApp app, not in-product) — the Message row above is
  // just our record of what staff sent, not a two-way in-app channel anymore.
  // Fire-and-log: WhatsApp delivery failure doesn't fail the request, since
  // the message is already saved and visible in the inbox either way.
  private async sendViaWhatsApp(
    member: { phone: string | null; homeBranchId: string },
    body: string,
  ): Promise<WhatsAppDeliveryResult> {
    if (!member.phone) {
      return { sent: false, reason: 'Member has no phone number on file.' };
    }

    const result = await this.sparkcoProvider.send({
      channel: 'whatsapp',
      to: member.phone,
      subject: '',
      body,
      sessionId: member.homeBranchId,
    });

    return result.status === 'sent'
      ? { sent: true }
      : { sent: false, reason: result.error };
  }

  // Counterpart to sendViaWhatsApp: a member's WhatsApp reply, delivered by
  // the SparkCo `message.received` webhook (see SparkcoWebhookController).
  // The webhook payload only carries the SparkCo-side tenant (one per API
  // key, i.e. this whole install) and the contact's phone number — not our
  // own Tenant/Member — so the member has to be resolved by phone here.
  // readByMemberAt is set immediately, same as sendFromMember: the member
  // obviously has "read" a message they just sent themselves.
  async receiveInboundWhatsApp(
    fromPhone: string,
    body: string,
  ): Promise<Message | null> {
    const trimmed = body.trim();
    if (!trimmed) {
      return null;
    }

    const member = await this.resolveMemberByPhone(fromPhone);
    if (!member) {
      this.logger.warn(
        `Inbound WhatsApp message from ${fromPhone} matched no member — dropped.`,
      );
      return null;
    }

    return this.prisma.message.create({
      data: {
        id: `message-${randomUUID()}`,
        tenantId: member.tenantId,
        memberId: member.id,
        senderType: 'member',
        body: trimmed,
        readByMemberAt: new Date(),
      },
    });
  }

  // Matches purely by phone digits since the webhook gives us no other
  // handle on our own tenant/member. Phone isn't a unique/indexed column, so
  // this is a full scan — fine at this install's member volume. Ties (two
  // members sharing digits, e.g. across tenants) are broken in favor of
  // whichever candidate already has a message thread, since that's the one
  // staff have actually been corresponding with.
  private async resolveMemberByPhone(
    rawPhone: string,
  ): Promise<{ id: string; tenantId: string } | null> {
    const targetDigits = phoneDigits(rawPhone);
    if (!targetDigits) {
      return null;
    }

    const candidates = await this.prisma.member.findMany({
      where: { phone: { not: null } },
      select: { id: true, tenantId: true, phone: true },
    });

    const matches = candidates.filter(
      (m) => m.phone && phoneDigits(m.phone) === targetDigits,
    );

    if (matches.length <= 1) {
      return matches[0] ?? null;
    }

    const withThread = await this.prisma.message.findFirst({
      where: { memberId: { in: matches.map((m) => m.id) } },
      orderBy: { createdAt: 'desc' },
      select: { memberId: true },
    });

    const chosen = withThread
      ? matches.find((m) => m.id === withThread.memberId)
      : undefined;

    if (!chosen) {
      this.logger.warn(
        `Inbound WhatsApp message from ${rawPhone} matched ${matches.length} members with no way to disambiguate — dropped.`,
      );
    }

    return chosen ?? null;
  }

  async getThreadForMember(tenantId: string, memberId: string) {
    const messages = await this.prisma.message.findMany({
      where: { tenantId, memberId },
      orderBy: { createdAt: 'asc' },
    });

    await this.prisma.message.updateMany({
      where: { tenantId, memberId, senderType: 'staff', readByMemberAt: null },
      data: { readByMemberAt: new Date() },
    });

    return messages;
  }

  async sendFromMember(
    tenantId: string,
    memberId: string,
    body: string | undefined,
  ) {
    const trimmed = body?.trim();
    if (!trimmed) {
      throw new BadRequestException('Message body is required.');
    }

    return this.prisma.message.create({
      data: {
        id: `message-${randomUUID()}`,
        tenantId,
        memberId,
        senderType: 'member',
        body: trimmed,
        readByMemberAt: new Date(),
      },
    });
  }

  async countUnreadForMember(
    tenantId: string,
    memberId: string,
  ): Promise<number> {
    return this.prisma.message.count({
      where: { tenantId, memberId, senderType: 'staff', readByMemberAt: null },
    });
  }

  private async requireMemberInScope(
    tenantId: string,
    branchId: string | undefined,
    memberId: string,
  ): Promise<{ id: string; phone: string | null; homeBranchId: string }> {
    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        tenantId,
        ...(branchId ? { homeBranchId: branchId } : {}),
      },
      select: { id: true, phone: true, homeBranchId: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found.');
    }
    return member;
  }
}
