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
import { requireRole } from '../../common/require-role';
import { DataScopeService } from '../../common/data-scope.service';
import { AuthService } from '../auth/auth.service';

type CreateUserRequestBody = {
  email?: string;
  username?: string;
  role?: 'owner' | 'manager' | 'front-desk';
  password?: string;
  branchId?: string;
  branchName?: string;
  employeeId?: string;
};

type UpdateUserRequestBody = {
  name?: string;
  email?: string;
  role?: 'owner' | 'manager' | 'front-desk';
  branchId?: string;
  branchName?: string;
  password?: string;
  employeeId?: string | null;
};

const MVP_ROLES = [
  {
    id: 'owner',
    label: 'Owner',
    description: 'Full access to all tenant settings, reports, and management.',
  },
  {
    id: 'manager',
    label: 'Manager',
    description:
      'Access to branch operations, members, reports, and staff management.',
  },
  {
    id: 'front-desk',
    label: 'Front Desk',
    description:
      'Access to member check-in, payments, and daily front-desk workflows.',
  },
];

@Controller()
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get('roles')
  listRoles() {
    return { roles: MVP_ROLES };
  }

  @Get('users')
  async listUsers(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return {
      users: await this.authService.listUsersForTenant(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  @Post('users')
  async createUser(
    @Req() request: Request,
    @Body() body: CreateUserRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      user: await this.authService.createUser(
        session.user.tenant.id,
        session.user.tenant.name,
        {
          email: body.email ?? '',
          username: body.username ?? '',
          role: body.role ?? 'front-desk',
          password: body.password ?? '',
          branchId: body.branchId ?? session.user.branch.id,
          branchName: body.branchName ?? session.user.branch.name,
          employeeId: body.employeeId ?? '',
        },
      ),
    };
  }

  @Get('users/:userId')
  async getUser(@Req() request: Request, @Param('userId') userId: string) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      user: await this.authService.getUserForTenant(
        session.user.tenant.id,
        userId,
      ),
    };
  }

  @Patch('users/:userId')
  async updateUser(
    @Req() request: Request,
    @Param('userId') userId: string,
    @Body() body: UpdateUserRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      user: await this.authService.updateUser(
        session.user.tenant.id,
        userId,
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
