import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { extname } from 'node:path';
import { MinioService } from '../../minio/minio.service';
import { DataScopeService } from '../../common/data-scope.service';
import { AuthService } from '../auth/auth.service';
import { MembersService } from './members.service';

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
    private readonly minioService: MinioService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get()
  async listMembers(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return {
      members: branchId
        ? await this.membersService.listMembersForScope(
            session.user.tenant.id,
            branchId,
          )
        : await this.membersService.listMembersForTenant(session.user.tenant.id),
    };
  }

  @Post()
  async createMember(
    @Req() request: Request,
    @Body() body: CreateMemberRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      member: await this.membersService.createMember(
        session.user.tenant.id,
        session.user.branch.id,
        {
          ...body,
          // Default attribution to the registering user's own employee
          // record so API-created members are attributed too, not only
          // form submissions where the UI pre-selects it.
          registeredEmployeeId:
            body.registeredEmployeeId ?? session.user.employeeId ?? undefined,
        },
      ),
    };
  }

  // Must be declared before :memberId to avoid "search" being captured as a param
  @Get('search')
  async searchMembers(@Req() request: Request, @Query('q') q: string) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    const all = branchId
      ? await this.membersService.listMembersForScope(
          session.user.tenant.id,
          branchId,
        )
      : await this.membersService.listMembersForTenant(session.user.tenant.id);
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
  async getMember(@Req() request: Request, @Param('memberId') memberId: string) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return {
      member: await this.membersService.getMemberForScope(
        session.user.tenant.id,
        branchId,
        memberId,
      ),
    };
  }

  @Patch(':memberId')
  async updateMember(
    @Req() request: Request,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return {
      member: await this.membersService.updateMember(
        session.user.tenant.id,
        branchId,
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
    const session = await this.getRequiredSession(request.headers.cookie);
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
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return this.membersService.sendQrViaWhatsApp(
      session.user.tenant.id,
      branchId,
      memberId,
    );
  }

  // Uses memory storage (default) — file is uploaded to MinIO object storage
  @Post(':memberId/photo')
  @UseInterceptors(FileInterceptor('picture', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMemberPhoto(
    @Req() request: Request,
    @Param('memberId') memberId: string,
    @UploadedFile() file: { originalname: string; buffer: Buffer; mimetype: string },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);

    const ext = extname(file.originalname) || '.jpg';
    const filename = `photo-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    await this.minioService.client.putObject(
      this.minioService.getBucket(),
      filename,
      file.buffer,
      file.buffer.length,
      { 'Content-Type': file.mimetype },
    );

    const pictureUrl = `/api/uploads/members/${filename}`;
    return {
      member: await this.membersService.updateMemberPicture(
        session.user.tenant.id,
        branchId,
        memberId,
        pictureUrl,
      ),
    };
  }

  // Staff sets/resets the PIN a member uses to sign into the mobile app.
  @Post(':memberId/pin')
  @HttpCode(204)
  async setMemberPin(
    @Req() request: Request,
    @Param('memberId') memberId: string,
    @Body() body: { pin?: string },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    await this.membersService.setMemberAppPin(
      session.user.tenant.id,
      branchId,
      memberId,
      body.pin ?? '',
    );
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
