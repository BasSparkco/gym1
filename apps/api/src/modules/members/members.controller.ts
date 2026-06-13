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
import { AuthService } from '../auth/auth.service';
import { MembersService } from './members.service';

type CreateMemberRequestBody = {
  fullName?: string;
  homeBranchId?: string;
  status?: 'active' | 'inactive';
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
};

type UpdateMemberRequestBody = {
  fullName?: string;
  homeBranchId?: string;
  status?: 'active' | 'inactive';
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
};

@Controller('members')
export class MembersController {
  constructor(
    private readonly authService: AuthService,
    private readonly membersService: MembersService,
  ) {}

  @Get()
  listMembers(@Req() request: Request) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      members: this.membersService.listMembersForScope(
        session.user.tenant.id,
        session.user.branch.id,
      ),
    };
  }

  @Post()
  createMember(@Req() request: Request, @Body() body: CreateMemberRequestBody) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      member: this.membersService.createMember(
        session.user.tenant.id,
        session.user.branch.id,
        body,
      ),
    };
  }

  @Get(':memberId')
  getMember(@Req() request: Request, @Param('memberId') memberId: string) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      member: this.membersService.getMemberForScope(
        session.user.tenant.id,
        session.user.branch.id,
        memberId,
      ),
    };
  }

  @Patch(':memberId')
  updateMember(
    @Req() request: Request,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberRequestBody,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    return {
      member: this.membersService.updateMember(
        session.user.tenant.id,
        session.user.branch.id,
        memberId,
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
