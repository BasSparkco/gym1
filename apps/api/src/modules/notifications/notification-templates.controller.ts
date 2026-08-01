import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { AuthService } from '../auth/auth.service';
import { NotificationTemplatesService } from './notification-templates.service';

@Controller('notifications/templates')
export class NotificationTemplatesController {
  constructor(
    private readonly authService: AuthService,
    private readonly templatesService: NotificationTemplatesService,
  ) {}

  @Get()
  async listTemplates(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      templates: await this.templatesService.listTemplatesForTenant(
        session.user.tenant.id,
      ),
    };
  }

  @Put(':templateKey/:lang')
  async upsertTemplate(
    @Req() request: Request,
    @Param('templateKey') templateKey: string,
    @Param('lang') lang: string,
    @Body() body: { subject: string; body: string },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      template: await this.templatesService.upsertTemplate(
        session.user.tenant.id,
        templateKey,
        lang,
        body.subject,
        body.body,
      ),
    };
  }

  @Delete(':templateKey/:lang')
  async resetTemplate(
    @Req() request: Request,
    @Param('templateKey') templateKey: string,
    @Param('lang') lang: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    await this.templatesService.resetTemplate(
      session.user.tenant.id,
      templateKey,
      lang,
    );

    return { ok: true };
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
