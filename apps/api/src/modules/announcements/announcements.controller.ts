import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { DataScopeService } from '../../common/data-scope.service';
import { AuthService } from '../auth/auth.service';
import { AnnouncementsService } from './announcements.service';

type CreateAnnouncementRequestBody = {
  branchId?: string;
  title?: string;
  body?: string;
};

@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly authService: AuthService,
    private readonly announcementsService: AnnouncementsService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get()
  async listAnnouncements(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const scopedBranchId = await this.dataScopeService.resolveBranchId(
      session.user,
    );

    return {
      announcements: await this.announcementsService.listForTenant(
        session.user.tenant.id,
        scopedBranchId,
      ),
    };
  }

  @Post()
  async createAnnouncement(
    @Req() request: Request,
    @Body() body: CreateAnnouncementRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      announcement: await this.announcementsService.create(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Delete(':announcementId')
  @HttpCode(200)
  async deleteAnnouncement(
    @Req() request: Request,
    @Param('announcementId') announcementId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    await this.announcementsService.delete(
      session.user.tenant.id,
      announcementId,
    );
    return { deleted: true };
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
