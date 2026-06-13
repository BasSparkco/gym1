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
import { AuthService } from '../auth/auth.service';

type CreateUserRequestBody = {
  email?: string;
  name?: string;
  role?: 'owner' | 'manager' | 'front-desk';
  password?: string;
  branchId?: string;
  branchName?: string;
};

type UpdateUserRequestBody = {
  name?: string;
  role?: 'owner' | 'manager' | 'front-desk';
  branchId?: string;
  branchName?: string;
  password?: string;
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
  constructor(private readonly authService: AuthService) {}

  @Get('roles')
  listRoles() {
    return { roles: MVP_ROLES };
  }

  @Get('users')
  listUsers(@Req() request: Request) {
    const session = this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      users: this.authService.listUsersForTenant(session.user.tenant.id),
    };
  }

  @Post('users')
  createUser(@Req() request: Request, @Body() body: CreateUserRequestBody) {
    const session = this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      user: this.authService.createUser(
        session.user.tenant.id,
        session.user.tenant.name,
        {
          email: body.email ?? '',
          name: body.name ?? '',
          role: body.role ?? 'front-desk',
          password: body.password ?? '',
          branchId: body.branchId ?? session.user.branch.id,
          branchName: body.branchName ?? session.user.branch.name,
        },
      ),
    };
  }

  @Get('users/:userId')
  getUser(@Req() request: Request, @Param('userId') userId: string) {
    const session = this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      user: this.authService.getUserForTenant(session.user.tenant.id, userId),
    };
  }

  @Patch('users/:userId')
  updateUser(
    @Req() request: Request,
    @Param('userId') userId: string,
    @Body() body: UpdateUserRequestBody,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      user: this.authService.updateUser(session.user.tenant.id, userId, body),
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
