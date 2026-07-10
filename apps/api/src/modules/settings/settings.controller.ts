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
} from '../../data/settings-seed';

type UpdateSettingsRequestBody = {
  defaultLanguage?: string;
  enabledLanguages?: string[];
  notificationSettings?: NotificationSettings;
  notificationSenders?: NotificationSenderSettings;
  dateFormat?: string;
  checkOutTrackingEnabled?: boolean;
  ownerDataScope?: string;
  reportingCurrencyCode?: string;
};

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  async getSettings(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      settings: await this.settingsService.getSettingsForTenant(
        session.user.tenant.id,
      ),
    };
  }

  @Patch()
  async updateSettings(
    @Req() request: Request,
    @Body() body: UpdateSettingsRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    if (body.ownerDataScope !== undefined) {
      requireRole(session.user, ['owner']);
    }

    if (body.reportingCurrencyCode !== undefined) {
      requireRole(session.user, ['owner']);
    }

    return {
      settings: await this.settingsService.updateSettingsForTenant(
        session.user.tenant.id,
        body,
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
