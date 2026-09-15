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
import { DataScopeService } from '../../common/data-scope.service';
import { AuthService } from '../auth/auth.service';
import { SettingsService } from '../settings/settings.service';
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
    private readonly dataScopeService: DataScopeService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  async listVisits(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);

    return {
      visits: await this.visitsService.listVisitsForScope(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  // Declared before ':visitId' so "latest" isn't swallowed as a visitId param.
  @Get('latest')
  async getLatestVisit(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const settings = await this.settingsService.getSettingsForTenant(
      session.user.tenant.id,
    );
    const branchId =
      settings.checkinPopupScope === 'all' ? undefined : session.user.branch.id;

    return {
      visit: await this.visitsService.getLatestVisitForPopup(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  @Post()
  async createVisit(@Req() request: Request, @Body() body: CreateVisitRequestBody) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      visit: await this.visitsService.createVisit(
        session.user.tenant.id,
        session.user.branch.id,
        body,
      ),
    };
  }

  @Post('check-in')
  @HttpCode(200)
  async checkIn(@Req() request: Request, @Body() body: CheckInRequestBody) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return this.visitsService.checkIn(
      session.user.tenant.id,
      session.user.branch.id,
      body,
    );
  }

  @Post(':visitId/check-out')
  @HttpCode(200)
  async checkOut(@Req() request: Request, @Param('visitId') visitId: string) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      visit: await this.visitsService.checkOut(
        session.user.tenant.id,
        session.user.branch.id,
        visitId,
      ),
    };
  }

  @Get(':visitId')
  async getVisit(@Req() request: Request, @Param('visitId') visitId: string) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);

    return {
      visit: await this.visitsService.getVisitForScope(
        session.user.tenant.id,
        branchId,
        visitId,
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
