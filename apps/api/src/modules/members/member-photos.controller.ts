import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { MinioService } from '../../minio/minio.service';
import { AuthService } from '../auth/auth.service';
import { MemberAuthService } from '../member-auth/member-auth.service';
import { extractBearerToken } from '../member-auth/extract-bearer-token';
import { contentTypeForStoredFilename } from '../../common/image-upload';
import { MembersService } from './members.service';

@Controller('uploads/members')
export class MemberPhotosController {
  constructor(
    private readonly authService: AuthService,
    private readonly memberAuthService: MemberAuthService,
    private readonly minioService: MinioService,
    private readonly membersService: MembersService,
  ) {}

  @Get(':filename')
  async getPhoto(
    @Req() req: Request,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Staff (web cookie) and members (mobile bearer token) both fetch
    // through this one route. Try the staff session first since it's the
    // more common caller; only spend a Redis round-trip on the bearer
    // lookup when there's no cookie session to check.
    const staffSession =
      await this.authService.getCurrentSessionFromCookieHeader(
        req.headers.cookie,
      );
    const memberSession = staffSession
      ? null
      : await this.memberAuthService.getCurrentSession(
          extractBearerToken(req.headers.authorization),
        );
    if (!staffSession && !memberSession) {
      throw new UnauthorizedException('Authentication required.');
    }

    // Filenames are opaque and never embed a tenant/member id, so resolve
    // the requesting caller's own tenant back to the Member row that owns
    // this filename — a member may only ever reach their own photo, and
    // staff are confined to their own tenant. Not found (rather than
    // forbidden) either way, so a wrong tenant/id can't be used to probe
    // for which filenames exist elsewhere.
    const tenantId = staffSession
      ? staffSession.user.tenant.id
      : memberSession!.tenantId;
    const owner = await this.membersService.findMemberByPictureFilename(
      tenantId,
      filename,
    );
    if (!owner || (memberSession && owner.id !== memberSession.id)) {
      throw new NotFoundException('Photo not found.');
    }

    try {
      const stream = await this.minioService.client.getObject(
        this.minioService.getBucket(),
        filename,
      );
      // Content-Type is derived from the (server-generated) filename, never
      // from client/stored input, so a browser is never left to MIME-sniff
      // an uploaded payload as HTML/SVG and execute it.
      res.setHeader('Content-Type', contentTypeForStoredFilename(filename));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, max-age=86400');
      stream.pipe(res);
    } catch {
      throw new NotFoundException('Photo not found.');
    }
  }
}
