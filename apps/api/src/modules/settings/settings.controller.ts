import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { extname } from 'node:path';
import { requireRole } from '../../common/require-role';
import { AuthService } from '../auth/auth.service';
import { MinioService } from '../../minio/minio.service';
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
  logoMode?: string;
};

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
    private readonly minioService: MinioService,
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

  // Uses memory storage (default) — file is uploaded to MinIO object storage,
  // same pattern as MembersController.uploadMemberPhoto.
  @Post('logo')
  @UseInterceptors(
    FileInterceptor('logo', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadLogo(
    @Req() request: Request,
    @UploadedFile()
    file: { originalname: string; buffer: Buffer; mimetype: string },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    const ext = extname(file.originalname) || '.png';
    const filename = `logo-tenant-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    await this.minioService.client.putObject(
      this.minioService.getBucket(),
      filename,
      file.buffer,
      file.buffer.length,
      { 'Content-Type': file.mimetype },
    );

    return {
      settings: await this.settingsService.updateTenantLogo(
        session.user.tenant.id,
        `/api/uploads/logos/${filename}`,
      ),
    };
  }

  @Delete('logo')
  async removeLogo(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      settings: await this.settingsService.updateTenantLogo(
        session.user.tenant.id,
        null,
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
