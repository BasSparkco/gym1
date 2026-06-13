import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { PaymentsService } from './payments.service';

type CreatePaymentRequestBody = {
  branchId?: string;
  memberId?: string;
  membershipId?: string;
  amount?: number;
  paymentDate?: string;
  status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'transfer';
};

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly authService: AuthService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get()
  listPayments(@Req() request: Request) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      payments: this.paymentsService.listPaymentsForScope(
        session.user.tenant.id,
        session.user.branch.id,
      ),
    };
  }

  @Get('member/:memberId')
  listPaymentsForMember(
    @Req() request: Request,
    @Param('memberId') memberId: string,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      payments: this.paymentsService.listPaymentsForMember(
        session.user.tenant.id,
        memberId,
      ),
    };
  }

  @Post()
  async createPayment(
    @Req() request: Request,
    @Body() body: CreatePaymentRequestBody,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      payment: await this.paymentsService.createPayment(
        session.user.tenant.id,
        session.user.branch.id,
        body,
      ),
    };
  }

  @Get(':paymentId')
  getPayment(@Req() request: Request, @Param('paymentId') paymentId: string) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      payment: this.paymentsService.getPaymentForScope(
        session.user.tenant.id,
        session.user.branch.id,
        paymentId,
      ),
    };
  }

  private getRequiredSession(cookieHeader: string | undefined) {
    const session =
      this.authService.getCurrentSessionFromCookieHeader(cookieHeader);

    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }

    return session;
  }
}
