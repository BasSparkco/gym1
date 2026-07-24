import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { toNumber } from '../../common/decimal';
import { NotificationsService } from '../notifications/notifications.service';
import { DebtService } from '../debt/debt.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Payment, PaymentMethod, PaymentStatus } from '../../generated/prisma/client';

type CreatePaymentInput = {
  branchId?: string;
  memberId?: string;
  membershipId?: string;
  amount?: number;
  paymentDate?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly debtService: DebtService,
  ) {}

  async listPaymentsForMember(tenantId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const payments = await this.prisma.payment.findMany({
      where: { memberId, tenantId },
    });
    return payments.map((p) => this.serialize(p));
  }

  async getPaymentForScope(
    tenantId: string,
    branchId: string | undefined,
    paymentId: string,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId, ...(branchId ? { branchId } : {}) },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    return this.serialize(payment);
  }

  async listPaymentsForScope(tenantId: string, branchId: string | undefined) {
    const payments = await this.prisma.payment.findMany({
      where: { tenantId, ...(branchId ? { branchId } : {}) },
    });
    return payments.map((p) => this.serialize(p));
  }

  async createPayment(tenantId: string, branchId: string, input: CreatePaymentInput) {
    if (!input.memberId || !input.membershipId || !input.paymentDate) {
      throw new BadRequestException(
        'Member, membership, and payment date are required.',
      );
    }

    if (typeof input.amount !== 'number' || input.amount <= 0) {
      throw new BadRequestException(
        'Payment amount must be greater than zero.',
      );
    }

    const targetBranchId = input.branchId ?? branchId;

    const branch = await this.prisma.branch.findFirst({
      where: { id: targetBranchId, tenantId },
    });
    const member = await this.prisma.member.findFirst({
      where: { id: input.memberId, tenantId },
    });
    const membership = await this.prisma.membership.findFirst({
      where: { id: input.membershipId, memberId: input.memberId },
    });

    if (!branch) {
      throw new BadRequestException('Branch is invalid for this tenant.');
    }

    if (!member) {
      throw new BadRequestException('Member is invalid for this tenant.');
    }

    if (!membership) {
      throw new BadRequestException('Membership is invalid for this member.');
    }

    const status = input.status ?? 'pending';

    const payment = await this.prisma.payment.create({
      data: {
        id: `payment-${randomUUID()}`,
        tenantId,
        branchId: targetBranchId,
        memberId: input.memberId,
        membershipId: input.membershipId,
        amount: input.amount,
        paymentDate: new Date(input.paymentDate),
        status,
        paymentMethod: input.paymentMethod ?? 'cash',
      },
    });

    if (status === 'pending') {
      await this.notificationsService.createNotificationsForEvent(
        tenantId,
        'paymentPending',
        payment.memberId,
        {
          subject: 'Payment reminder',
          body: `You have a pending payment of ${payment.amount} due on ${input.paymentDate}. Please settle your balance at the front desk.`,
          relatedId: payment.id,
        },
      );
    }

    await this.debtService.recompute(payment.memberId);

    return this.serialize(payment);
  }

  // Postgres Decimal columns come back from Prisma as Decimal objects; the
  // API contract (and the web app, which calls `.toLocaleString()` on
  // amount) expects a plain number, same as the old JSON store.
  private serialize(payment: Payment) {
    return { ...payment, amount: toNumber(payment.amount) };
  }
}
