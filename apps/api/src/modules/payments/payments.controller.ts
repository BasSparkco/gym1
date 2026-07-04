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
import { DataScopeService } from '../../common/data-scope.service';
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
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get()
  async listPayments(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);

    return {
      payments: await this.paymentsService.listPaymentsForScope(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  @Get('member/:memberId')
  async listPaymentsForMember(
    @Req() request: Request,
    @Param('memberId') memberId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      payments: await this.paymentsService.listPaymentsForMember(
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
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      payment: await this.paymentsService.createPayment(
        session.user.tenant.id,
        session.user.branch.id,
        body,
      ),
    };
  }

  @Get(':paymentId')
  async getPayment(@Req() request: Request, @Param('paymentId') paymentId: string) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);

    return {
      payment: await this.paymentsService.getPaymentForScope(
        session.user.tenant.id,
        branchId,
        paymentId,
      ),
    };
  }

  private async getRequiredSession(cookieHeader: string | undefined) {
    const session =
      await this.authService.getCurrentSessionFromCookieHeader(cookieHeader);

    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }

    return session;
  }
}
