import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { AuthService } from '../auth/auth.service';
import { DiscountTypesService } from './discount-types.service';

type CreateDiscountTypeRequestBody = {
  name?: string;
  nameAr?: string;
  nameHe?: string;
  description?: string;
  defaultPercent?: number;
};

type UpdateDiscountTypeRequestBody = {
  name?: string;
  nameAr?: string | null;
  nameHe?: string | null;
  description?: string | null;
  defaultPercent?: number;
  isActive?: boolean;
};

@Controller('discount-types')
export class DiscountTypesController {
  constructor(
    private readonly authService: AuthService,
    private readonly discountTypesService: DiscountTypesService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      discountTypes: await this.discountTypesService.listForTenant(
        session.user.tenant.id,
        { includeInactive: includeInactive === 'true' },
      ),
    };
  }

  @Get(':discountTypeId')
  async get(
    @Req() request: Request,
    @Param('discountTypeId') discountTypeId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      discountType: await this.discountTypesService.getForTenant(
        session.user.tenant.id,
        discountTypeId,
      ),
    };
  }

  @Post()
  async create(
    @Req() request: Request,
    @Body() body: CreateDiscountTypeRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      discountType: await this.discountTypesService.create(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Patch(':discountTypeId')
  async update(
    @Req() request: Request,
    @Param('discountTypeId') discountTypeId: string,
    @Body() body: UpdateDiscountTypeRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      discountType: await this.discountTypesService.update(
        session.user.tenant.id,
        discountTypeId,
        body,
      ),
    };
  }

  @Post(':discountTypeId/deactivate')
  async deactivate(
    @Req() request: Request,
    @Param('discountTypeId') discountTypeId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      discountType: await this.discountTypesService.deactivate(
        session.user.tenant.id,
        discountTypeId,
      ),
    };
  }

  @Post(':discountTypeId/reactivate')
  async reactivate(
    @Req() request: Request,
    @Param('discountTypeId') discountTypeId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      discountType: await this.discountTypesService.reactivate(
        session.user.tenant.id,
        discountTypeId,
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
