import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PlatformAdminAuthService } from './platform-admin-auth.service';
import { PlatformAdminTenantsService } from './platform-admin-tenants.service';
import type { AddBranchInput, CreateTenantInput } from './platform-admin-tenants.service';

@Controller('platform-admin/tenants')
export class PlatformAdminTenantsController {
  constructor(
    private readonly authService: PlatformAdminAuthService,
    private readonly tenantsService: PlatformAdminTenantsService,
  ) {}

  @Get()
  async listTenants(@Req() request: Request) {
    await this.getRequiredSession(request.headers.cookie);
    return { tenants: await this.tenantsService.listTenants() };
  }

  @Post()
  async createTenant(
    @Req() request: Request,
    @Body() body: CreateTenantInput,
  ) {
    await this.getRequiredSession(request.headers.cookie);
    return { tenant: await this.tenantsService.createTenant(body) };
  }

  @Patch(':tenantId')
  async updateTenant(
    @Req() request: Request,
    @Param('tenantId') tenantId: string,
    @Body() body: { name?: string },
  ) {
    await this.getRequiredSession(request.headers.cookie);
    return {
      tenant: await this.tenantsService.updateTenantName(
        tenantId,
        body.name ?? '',
      ),
    };
  }

  @Patch(':tenantId/pause')
  async pauseTenant(
    @Req() request: Request,
    @Param('tenantId') tenantId: string,
    @Body() body: { reason?: string },
  ) {
    await this.getRequiredSession(request.headers.cookie);
    return {
      tenant: await this.tenantsService.pauseTenant(tenantId, body.reason ?? ''),
    };
  }

  @Patch(':tenantId/resume')
  async resumeTenant(
    @Req() request: Request,
    @Param('tenantId') tenantId: string,
  ) {
    await this.getRequiredSession(request.headers.cookie);
    return { tenant: await this.tenantsService.resumeTenant(tenantId) };
  }

  @Get(':tenantId/branches')
  async listBranches(
    @Req() request: Request,
    @Param('tenantId') tenantId: string,
  ) {
    await this.getRequiredSession(request.headers.cookie);
    return { branches: await this.tenantsService.listBranches(tenantId) };
  }

  @Post(':tenantId/branches')
  async addBranch(
    @Req() request: Request,
    @Param('tenantId') tenantId: string,
    @Body() body: AddBranchInput,
  ) {
    await this.getRequiredSession(request.headers.cookie);
    return { branch: await this.tenantsService.addBranch(tenantId, body) };
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
