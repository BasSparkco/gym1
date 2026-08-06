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
import { contentTypeForStoredFilename } from '../../common/image-upload';

@Controller('uploads/members')
export class MemberPhotosController {
  constructor(
    private readonly authService: AuthService,
    private readonly minioService: MinioService,
  ) {}

  @Get(':filename')
  async getPhoto(
    @Req() req: Request,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const session = await this.authService.getCurrentSessionFromCookieHeader(
      req.headers.cookie,
    );
    if (!session) {
      throw new UnauthorizedException('Authentication required.');
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
