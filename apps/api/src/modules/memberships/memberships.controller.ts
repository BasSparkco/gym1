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
import { MembershipsService } from './memberships.service';

type CreateMembershipPlanRequestBody = {
  name?: string;
  planType?: 'duration' | 'session';
  durationDays?: number;
  sessionCount?: number;
  price?: number;
  allowAllBranches?: boolean;
  freezeAllowed?: boolean;
  freezeMaxDays?: number;
};

type UpdateMembershipPlanRequestBody = {
  name?: string;
  planType?: 'duration' | 'session';
  durationDays?: number;
  sessionCount?: number;
  price?: number;
  allowAllBranches?: boolean;
  freezeAllowed?: boolean;
  freezeMaxDays?: number;
};

type CreateMembershipRequestBody = {
  memberId?: string;
  planId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'draft' | 'active' | 'frozen' | 'expired' | 'cancelled';
  finalPrice?: number;
};

type UpdateMembershipRequestBody = {
  status?: 'draft' | 'active' | 'frozen' | 'expired' | 'cancelled';
  startDate?: string;
  endDate?: string;
  finalPrice?: number;
};

@Controller('memberships')
export class MembershipsController {
  constructor(
    private readonly authService: AuthService,
    private readonly membershipsService: MembershipsService,
  ) {}

  @Get()
  listMemberships(@Req() request: Request) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      memberships: this.membershipsService.listMembershipsForTenant(
        session.user.tenant.id,
      ),
    };
  }

  @Get('plans')
  listMembershipPlans(@Req() request: Request) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      plans: this.membershipsService.listMembershipPlansForTenant(
        session.user.tenant.id,
      ),
    };
  }

  @Post('plans')
  createMembershipPlan(
    @Req() request: Request,
    @Body() body: CreateMembershipPlanRequestBody,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      plan: this.membershipsService.createMembershipPlan(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Get('plans/:planId')
  getMembershipPlan(@Req() request: Request, @Param('planId') planId: string) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      plan: this.membershipsService.getMembershipPlanForTenant(
        session.user.tenant.id,
        planId,
      ),
    };
  }

  @Patch('plans/:planId')
  updateMembershipPlan(
    @Req() request: Request,
    @Param('planId') planId: string,
    @Body() body: UpdateMembershipPlanRequestBody,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      plan: this.membershipsService.updateMembershipPlan(
        session.user.tenant.id,
        planId,
        body,
      ),
    };
  }

  @Get('member/:memberId')
  listMembershipsForMember(
    @Req() request: Request,
    @Param('memberId') memberId: string,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      memberships: this.membershipsService.listMembershipsForMember(
        session.user.tenant.id,
        memberId,
      ),
    };
  }

  @Post()
  async createMembership(
    @Req() request: Request,
    @Body() body: CreateMembershipRequestBody,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      membership: await this.membershipsService.createMembership(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Post(':membershipId/renew')
  async renewMembership(
    @Req() request: Request,
    @Param('membershipId') membershipId: string,
    @Body() body: { planId?: string; startDate?: string; finalPrice?: number },
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      membership: await this.membershipsService.renewMembership(
        session.user.tenant.id,
        membershipId,
        body,
      ),
    };
  }

  @Get(':membershipId/freezes')
  listFreezesForMembership(
    @Req() request: Request,
    @Param('membershipId') membershipId: string,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      freezes: this.membershipsService.listFreezesForMembership(
        session.user.tenant.id,
        membershipId,
      ),
    };
  }

  @Post(':membershipId/freeze')
  createFreeze(
    @Req() request: Request,
    @Param('membershipId') membershipId: string,
    @Body() body: { startDate?: string; endDate?: string },
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return this.membershipsService.createFreeze(
      session.user.tenant.id,
      membershipId,
      body,
    );
  }

  @Post(':membershipId/unfreeze')
  unfreezeM(
    @Req() request: Request,
    @Param('membershipId') membershipId: string,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      membership: this.membershipsService.unfreezeM(
        session.user.tenant.id,
        membershipId,
      ),
    };
  }

  @Get(':membershipId')
  getMembership(
    @Req() request: Request,
    @Param('membershipId') membershipId: string,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      membership: this.membershipsService.getMembershipForTenant(
        session.user.tenant.id,
        membershipId,
      ),
    };
  }

  @Patch(':membershipId')
  updateMembership(
    @Req() request: Request,
    @Param('membershipId') membershipId: string,
    @Body() body: UpdateMembershipRequestBody,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      membership: this.membershipsService.updateMembership(
        session.user.tenant.id,
        membershipId,
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
