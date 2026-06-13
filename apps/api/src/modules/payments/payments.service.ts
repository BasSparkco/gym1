import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  PaymentRecord,
  readOperationsStore,
  writeOperationsStore,
} from '../../data/operations-store';
import { NotificationsService } from '../notifications/notifications.service';

type CreatePaymentInput = {
  branchId?: string;
  memberId?: string;
  membershipId?: string;
  amount?: number;
  paymentDate?: string;
  status?: PaymentRecord['status'];
  paymentMethod?: PaymentRecord['paymentMethod'];
};

@Injectable()
export class PaymentsService {
  constructor(private readonly notificationsService: NotificationsService) {}

  listPaymentsForMember(tenantId: string, memberId: string) {
    const store = readOperationsStore();
    const member = store.members.find(
      (candidate) =>
        candidate.id === memberId && candidate.tenantId === tenantId,
    );

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    return store.payments.filter(
      (payment) =>
        payment.memberId === memberId && payment.tenantId === tenantId,
    );
  }

  getPaymentForScope(tenantId: string, branchId: string, paymentId: string) {
    const payment = readOperationsStore().payments.find(
      (candidate) =>
        candidate.id === paymentId &&
        candidate.tenantId === tenantId &&
        candidate.branchId === branchId,
    );

    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    return payment;
  }

  listPaymentsForScope(tenantId: string, branchId: string) {
    return readOperationsStore().payments.filter((payment) => {
      return payment.tenantId === tenantId && payment.branchId === branchId;
    });
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

    const store = readOperationsStore();
    const targetBranchId = input.branchId ?? branchId;
    const branch = store.branches.find((candidate) => {
      return candidate.id === targetBranchId && candidate.tenantId === tenantId;
    });
    const member = store.members.find((candidate) => {
      return candidate.id === input.memberId && candidate.tenantId === tenantId;
    });
    const membership = store.memberships.find((candidate) => {
      return (
        candidate.id === input.membershipId &&
        candidate.memberId === input.memberId
      );
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

    const payment: PaymentRecord = {
      id: `payment-${randomUUID()}`,
      tenantId,
      branchId: targetBranchId,
      memberId: input.memberId,
      membershipId: input.membershipId,
      amount: input.amount,
      paymentDate: input.paymentDate,
      status: input.status ?? 'pending',
      paymentMethod: input.paymentMethod ?? 'cash',
    };

    store.payments.push(payment);
    writeOperationsStore(store);

    if (payment.status === 'pending') {
      await this.notificationsService.createNotificationsForEvent(
        tenantId,
        'paymentPending',
        payment.memberId,
        {
          subject: 'Payment reminder',
          body: `You have a pending payment of ${payment.amount} due on ${payment.paymentDate}. Please settle your balance at the front desk.`,
          relatedId: payment.id,
        },
      );
    }

    return payment;
  }
}
