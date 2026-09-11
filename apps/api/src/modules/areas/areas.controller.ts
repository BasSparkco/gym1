import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { AreasService } from './areas.service';

@Controller('areas')
export class AreasController {
  constructor(
    private readonly authService: AuthService,
    private readonly areasService: AreasService,
  ) {}

  @Get()
  async listAreas(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      areas: await this.areasService.listAreasForTenant(
        session.user.tenant.id,
      ),
    };
  }

  // No role restriction, same as member creation — front-desk staff need to
  // add a new area inline from the member form's "add new" popup.
  @Post()
  async createArea(
    @Req() request: Request,
    @Body() body: { name?: string },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      area: await this.areasService.createArea(
        session.user.tenant.id,
        body.name,
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
