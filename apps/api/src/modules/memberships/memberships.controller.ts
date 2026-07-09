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
  allowAllPrograms?: boolean;
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
  allowAllPrograms?: boolean;
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
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get()
  async listMemberships(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);

    return {
      memberships: await this.membershipsService.listMembershipsForTenant(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  @Get('plans')
  async listMembershipPlans(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      plans: await this.membershipsService.listMembershipPlansForTenant(
        session.user.tenant.id,
      ),
    };
  }

  @Post('plans')
  async createMembershipPlan(
    @Req() request: Request,
    @Body() body: CreateMembershipPlanRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      plan: await this.membershipsService.createMembershipPlan(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Get('plans/:planId')
  async getMembershipPlan(@Req() request: Request, @Param('planId') planId: string) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      plan: await this.membershipsService.getMembershipPlanForTenant(
        session.user.tenant.id,
        planId,
      ),
    };
  }

  @Patch('plans/:planId')
  async updateMembershipPlan(
    @Req() request: Request,
    @Param('planId') planId: string,
    @Body() body: UpdateMembershipPlanRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      plan: await this.membershipsService.updateMembershipPlan(
        session.user.tenant.id,
        planId,
        body,
      ),
    };
  }

  @Get('member/:memberId')
  async listMembershipsForMember(
    @Req() request: Request,
    @Param('memberId') memberId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      memberships: await this.membershipsService.listMembershipsForMember(
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
    const session = await this.getRequiredSession(request.headers.cookie);

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
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      membership: await this.membershipsService.renewMembership(
        session.user.tenant.id,
        membershipId,
        body,
      ),
    };
  }

  @Get(':membershipId/freezes')
  async listFreezesForMembership(
    @Req() request: Request,
    @Param('membershipId') membershipId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      freezes: await this.membershipsService.listFreezesForMembership(
        session.user.tenant.id,
        membershipId,
      ),
    };
  }

  @Post(':membershipId/freeze')
  async createFreeze(
    @Req() request: Request,
    @Param('membershipId') membershipId: string,
    @Body() body: { startDate?: string; endDate?: string },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return this.membershipsService.createFreeze(
      session.user.tenant.id,
      membershipId,
      body,
    );
  }

  @Post(':membershipId/unfreeze')
  async unfreezeM(
    @Req() request: Request,
    @Param('membershipId') membershipId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      membership: await this.membershipsService.unfreezeM(
        session.user.tenant.id,
        membershipId,
      ),
    };
  }

  @Get(':membershipId')
  async getMembership(
    @Req() request: Request,
    @Param('membershipId') membershipId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      membership: await this.membershipsService.getMembershipForTenant(
        session.user.tenant.id,
        membershipId,
      ),
    };
  }

  @Patch(':membershipId')
  async updateMembership(
    @Req() request: Request,
    @Param('membershipId') membershipId: string,
    @Body() body: UpdateMembershipRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      membership: await this.membershipsService.updateMembership(
        session.user.tenant.id,
        membershipId,
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
