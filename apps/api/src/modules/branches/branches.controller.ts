import {
  BadRequestException,
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
import { requireRole } from '../../common/require-role';
import { AuthService } from '../auth/auth.service';
import { BranchesService } from './branches.service';

type CreateBranchRequestBody = {
  name?: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  operatingCurrencyCode?: string;
  status?: 'active' | 'inactive';
};

type UpdateBranchRequestBody = {
  name?: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  operatingCurrencyCode?: string;
  status?: 'active' | 'inactive';
};

@Controller('branches')
export class BranchesController {
  constructor(
    private readonly authService: AuthService,
    private readonly branchesService: BranchesService,
  ) {}

  @Get()
  async listBranches(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      branches: await this.branchesService.listBranchesForTenant(
        session.user.tenant.id,
      ),
    };
  }

  @Post()
  async createBranch(
    @Req() request: Request,
    @Body() body: CreateBranchRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      branch: await this.branchesService.createBranch(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Get(':branchId')
  async getBranch(@Req() request: Request, @Param('branchId') branchId: string) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      branch: await this.branchesService.getBranchForTenant(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  @Patch(':branchId')
  async updateBranch(
    @Req() request: Request,
    @Param('branchId') branchId: string,
    @Body() body: UpdateBranchRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    const branch = await this.branchesService.updateBranch(
      session.user.tenant.id,
      branchId,
      body,
    );

    if (body.name !== undefined) {
      await this.authService.syncBranchNameForUsers(
        session.user.tenant.id,
        branchId,
        branch.name,
      );
    }

    return { branch };
  }

  @Post('switch')
  async switchBranch(
    @Req() request: Request,
    @Body() body: { branchId?: string },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner']);

    if (!body.branchId) {
      throw new BadRequestException('branchId is required.');
    }

    const branch = await this.branchesService.getBranchForTenant(
      session.user.tenant.id,
      body.branchId,
    );

    const user = await this.authService.switchBranchForUser(
      session.user.tenant.id,
      session.user.id,
      branch.id,
      branch.name,
    );

    return { user };
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
