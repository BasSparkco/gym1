import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { MembersService } from '../members/members.service';
import { MembershipsService } from '../memberships/memberships.service';
import { MemberAuthService, MemberSession } from './member-auth.service';
import { extractBearerToken } from './extract-bearer-token';

// The member-facing counterpart to MembersController's staff routes: same
// underlying data, but authorized by a member's own bearer token instead of
// a staff session cookie, and always scoped to that one member.
@Controller('me')
export class MeController {
  constructor(
    private readonly memberAuthService: MemberAuthService,
    private readonly membersService: MembersService,
    private readonly membershipsService: MembershipsService,
  ) {}

  @Get()
  async getProfile(@Req() request: Request) {
    const session = await this.getRequiredMemberSession(request);
    return {
      member: await this.membersService.getMemberForScope(
        session.tenantId,
        undefined,
        session.id,
      ),
    };
  }

  @Get('memberships')
  async getMemberships(@Req() request: Request) {
    const session = await this.getRequiredMemberSession(request);
    return {
      memberships: await this.membershipsService.listMembershipsForMember(
        session.tenantId,
        session.id,
      ),
    };
  }

  @Get('qrcode')
  async getQrCode(@Req() request: Request, @Res() res: Response) {
    const session = await this.getRequiredMemberSession(request);
    const buffer = await this.membersService.getMemberQrCodeBuffer(
      session.tenantId,
      session.id,
    );
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(buffer);
  }

  private async getRequiredMemberSession(
    request: Request,
  ): Promise<MemberSession> {
    const session = await this.memberAuthService.getCurrentSession(
      extractBearerToken(request.headers.authorization),
    );
    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }
    return session;
  }
}
