import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { AuthService } from '../auth/auth.service';
import { MembersService } from './members.service';

function getUploadsDir() {
  const root = process.env.API_DATA_ROOT ?? join(__dirname, '..', '..', '..');
  return join(root, '.local', 'uploads', 'members');
}

type CreateMemberRequestBody = {
  fullName?: string;
  homeBranchId?: string;
  status?: 'active' | 'inactive';
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  sex?: 'male' | 'female';
  idNumber?: string;
  address?: string;
  height?: number;
  weight?: number;
  registeredEmployeeId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  rfidTag?: string;
};

type UpdateMemberRequestBody = {
  fullName?: string;
  homeBranchId?: string;
  status?: 'active' | 'inactive';
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  sex?: 'male' | 'female';
  idNumber?: string;
  address?: string;
  height?: number;
  weight?: number;
  registeredEmployeeId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  rfidTag?: string;
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

  // Must be declared before :memberId to avoid "search" being captured as a param
  @Get('search')
  searchMembers(@Req() request: Request, @Query('q') q: string) {
    const session = this.getRequiredSession(request.headers.cookie);
    const all = this.membersService.listMembersForScope(
      session.user.tenant.id,
      session.user.branch.id,
    );
    const query = (q ?? '').trim().toLowerCase();
    const queryDigits = query.replace(/\D/g, '').replace(/^0+/, '');
    const members = query
      ? all
          .filter(
            (m) =>
              m.fullName.toLowerCase().includes(query) ||
              m.memberNumber.toLowerCase().includes(query) ||
              (queryDigits.length >= 4 && m.phone && m.phone.replace(/\D/g, '').includes(queryDigits)) ||
              (m.idNumber && m.idNumber.toLowerCase().includes(query)),
          )
          .slice(0, 8)
          .map(({ id, fullName, memberNumber, status }) => ({
            id,
            fullName,
            memberNumber,
            status,
          }))
      : [];
    return { members };
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

  // GET /:memberId/qrcode — session-protected PNG for display in the web app
  @Get(':memberId/qrcode')
  async getMemberQrCode(
    @Req() request: Request,
    @Param('memberId') memberId: string,
    @Res() res: Response,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);
    const buffer = await this.membersService.getMemberQrCodeBuffer(
      session.user.tenant.id,
      memberId,
    );
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(buffer);
  }

  // GET /:memberId/qrcode/public?sig=<hmac> — no session, HMAC-signed for WhatsApp links
  @Get(':memberId/qrcode/public')
  async getMemberQrCodePublic(
    @Param('memberId') memberId: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ) {
    if (!this.membersService.verifyQrSig(memberId, sig ?? '')) {
      throw new UnauthorizedException('Invalid or missing signature.');
    }
    const buffer = await this.membersService.getMemberQrCodeBufferById(memberId);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="gym-qr.png"');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(buffer);
  }

  // POST /:memberId/send-qr — sends QR download link to member via WhatsApp
  @Post(':memberId/send-qr')
  async sendMemberQr(
    @Req() request: Request,
    @Param('memberId') memberId: string,
  ) {
    const session = this.getRequiredSession(request.headers.cookie);
    return this.membersService.sendQrViaWhatsApp(
      session.user.tenant.id,
      session.user.branch.id,
      memberId,
    );
  }

  // Uses memory storage (default) — file is written manually to disk
  @Post(':memberId/photo')
  @UseInterceptors(FileInterceptor('picture', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadMemberPhoto(
    @Req() request: Request,
    @Param('memberId') memberId: string,
    @UploadedFile() file: { originalname: string; buffer: Buffer; mimetype: string },
  ) {
    const session = this.getRequiredSession(request.headers.cookie);

    const uploadsDir = getUploadsDir();
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = extname(file.originalname) || '.jpg';
    const filename = `photo-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    writeFileSync(join(uploadsDir, filename), file.buffer);

    const pictureUrl = `/api/uploads/members/${filename}`;
    return {
      member: this.membersService.updateMemberPicture(
        session.user.tenant.id,
        session.user.branch.id,
        memberId,
        pictureUrl,
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
