import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { AuthService } from '../auth/auth.service';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly authService: AuthService,
    private readonly notificationsService: NotificationsService,
    private readonly dispatchService: NotificationDispatchService,
  ) {}

  @Get()
  listNotifications(@Req() request: Request) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      notifications: this.notificationsService.listNotificationsForTenant(
        session.user.tenant.id,
      ),
    };
  }

  @Get(':notificationId')
  getNotification(
    @Req() request: Request,
    @Param('notificationId') notificationId: string,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      notification: this.notificationsService.getNotificationForTenant(
        session.user.tenant.id,
        notificationId,
      ),
    };
  }

  @Post('scan')
  async scanForExpiryNotifications(@Req() request: Request) {
    const session = this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return this.notificationsService.scanForExpiryNotifications(
      session.user.tenant.id,
    );
  }

  @Post('dispatch')
  async dispatchPending(@Req() request: Request) {
    const session = this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return this.dispatchService.dispatchPendingForTenant(
      session.user.tenant.id,
    );
  }

  @Post(':notificationId/dispatch')
  async dispatchNotification(
    @Req() request: Request,
    @Param('notificationId') notificationId: string,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      notification: await this.dispatchService.dispatchNotificationForTenant(
        session.user.tenant.id,
        notificationId,
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
