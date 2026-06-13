import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { AuthService } from '../auth/auth.service';
import { SettingsService } from './settings.service';
import type {
  NotificationSenderSettings,
  NotificationSettings,
} from '../../data/settings-store';

type UpdateSettingsRequestBody = {
  defaultLanguage?: string;
  enabledLanguages?: string[];
  notificationSettings?: NotificationSettings;
  notificationSenders?: NotificationSenderSettings;
};

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  getSettings(@Req() request: Request) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      settings: this.settingsService.getSettingsForTenant(
        session.user.tenant.id,
      ),
    };
  }

  @Patch()
  updateSettings(
    @Req() request: Request,
    @Body() body: UpdateSettingsRequestBody,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      settings: this.settingsService.updateSettingsForTenant(
        session.user.tenant.id,
        body,
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
