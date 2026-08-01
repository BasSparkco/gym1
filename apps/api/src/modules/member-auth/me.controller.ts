import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { MembersService } from '../members/members.service';
import { MembershipsService } from '../memberships/memberships.service';
import { AnnouncementsService } from '../announcements/announcements.service';
import { ClosedDatesService } from '../closed-dates/closed-dates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MemberAuthService, MemberSession } from './member-auth.service';
import { extractBearerToken } from './extract-bearer-token';

type DeviceTokenRequestBody = {
  token?: string;
  platform?: string;
};

// The member-facing counterpart to MembersController's staff routes: same
// underlying data, but authorized by a member's own bearer token instead of
// a staff session cookie, and always scoped to that one member.
@Controller('me')
export class MeController {
  constructor(
    private readonly memberAuthService: MemberAuthService,
    private readonly membersService: MembersService,
    private readonly membershipsService: MembershipsService,
    private readonly announcementsService: AnnouncementsService,
    private readonly closedDatesService: ClosedDatesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  async getProfile(@Req() request: Request) {
    const session = await this.getRequiredMemberSession(request);
    return {
      member: await this.membersService.getMemberForScope(
        session.tenantId,
        undefined,
        session.id,
      ),
    };
  }

  @Get('memberships')
  async getMemberships(@Req() request: Request) {
    const session = await this.getRequiredMemberSession(request);
    return {
      memberships: await this.membershipsService.listMembershipsForMember(
        session.tenantId,
        session.id,
      ),
    };
  }

  @Post('device-token')
  @HttpCode(204)
  async registerDeviceToken(
    @Req() request: Request,
    @Body() body: DeviceTokenRequestBody,
  ): Promise<void> {
    const session = await this.getRequiredMemberSession(request);
    await this.membersService.upsertDeviceToken(
      session.id,
      body.token ?? '',
      body.platform,
    );
  }

  @Get('announcements')
  async getAnnouncements(@Req() request: Request) {
    const session = await this.getRequiredMemberSession(request);
    return {
      announcements: await this.announcementsService.listForMember(
        session.tenantId,
        session.homeBranchId,
      ),
    };
  }

  @Get('notifications')
  async getNotifications(@Req() request: Request) {
    const session = await this.getRequiredMemberSession(request);
    const notifications =
      await this.notificationsService.listAppNotificationsForMember(
        session.tenantId,
        session.id,
      );
    return {
      notifications: notifications.map((notification) => ({
        id: notification.id,
        event: notification.event,
        subject: notification.subject,
        body: notification.body,
        createdAt: notification.sentAt ?? notification.createdAt,
      })),
    };
  }

  @Get('closed-dates')
  async getClosedDates(@Req() request: Request) {
    const session = await this.getRequiredMemberSession(request);
    return {
      closedDates: await this.closedDatesService.listUpcomingForMember(
        session.tenantId,
        session.homeBranchId,
      ),
    };
  }

  @Get('qrcode')
  async getQrCode(@Req() request: Request, @Res() res: Response) {
    const session = await this.getRequiredMemberSession(request);
    const buffer = await this.membersService.getMemberQrCodeBuffer(
      session.tenantId,
      session.id,
    );
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(buffer);
  }

  private async getRequiredMemberSession(
    request: Request,
  ): Promise<MemberSession> {
    const session = await this.memberAuthService.getCurrentSession(
      extractBearerToken(request.headers.authorization),
    );
    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }
    return session;
  }
}
