import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { VisitsService } from './visits.service';

type CreateVisitRequestBody = {
  memberId?: string;
  branchId?: string;
  checkInTime?: string;
  accessMethod?: 'manual' | 'qr';
};

type CheckInRequestBody = {
  memberIdentifier?: string;
  accessMethod?: 'manual' | 'qr';
};

@Controller('visits')
export class VisitsController {
  constructor(
    private readonly authService: AuthService,
    private readonly visitsService: VisitsService,
  ) {}

  @Get()
  listVisits(@Req() request: Request) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      visits: this.visitsService.listVisitsForScope(
        session.user.tenant.id,
        session.user.branch.id,
      ),
    };
  }

  @Post()
  createVisit(@Req() request: Request, @Body() body: CreateVisitRequestBody) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      visit: this.visitsService.createVisit(
        session.user.tenant.id,
        session.user.branch.id,
        body,
      ),
    };
  }

  @Post('check-in')
  @HttpCode(200)
  checkIn(@Req() request: Request, @Body() body: CheckInRequestBody) {
    const session = this.getRequiredSession(request.headers.cookie);

    return this.visitsService.checkIn(
      session.user.tenant.id,
      session.user.branch.id,
      body,
    );
  }

  @Post(':visitId/check-out')
  @HttpCode(200)
  checkOut(@Req() request: Request, @Param('visitId') visitId: string) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      visit: this.visitsService.checkOut(
        session.user.tenant.id,
        session.user.branch.id,
        visitId,
      ),
    };
  }

  @Get(':visitId')
  getVisit(@Req() request: Request, @Param('visitId') visitId: string) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      visit: this.visitsService.getVisitForScope(
        session.user.tenant.id,
        session.user.branch.id,
        visitId,
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
