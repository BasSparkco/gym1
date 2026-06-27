import { Controller, Delete, Get, HttpCode, Param, Post, Put, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { AuthService } from '../auth/auth.service';
import { TenancyService } from './tenancy.service';

@Controller('tenancy')
export class TenancyController {
  constructor(
    private readonly auth: AuthService,
    private readonly tenancy: TenancyService,
  ) {}

  // Per-branch WhatsApp endpoints
  @Put('whatsapp/branches/:branchId')
  connectBranchWhatsApp(@Req() req: Request, @Param('branchId') branchId: string) {
    requireRole(this.session(req), ['owner']);
    return this.tenancy.connectBranchWhatsApp(branchId);
  }

  @Get('whatsapp/branches/:branchId/qr')
  getBranchQr(@Req() req: Request, @Param('branchId') branchId: string) {
    requireRole(this.session(req), ['owner', 'manager']);
    return this.tenancy.getBranchWhatsAppQr(branchId);
  }

  @Post('whatsapp/branches/:branchId/verify')
  @HttpCode(200)
  verifyBranchWhatsApp(@Req() req: Request, @Param('branchId') branchId: string) {
    requireRole(this.session(req), ['owner', 'manager']);
    return this.tenancy.verifyBranchWhatsApp(branchId);
  }

  @Delete('whatsapp/branches/:branchId')
  disconnectBranchWhatsApp(@Req() req: Request, @Param('branchId') branchId: string) {
    requireRole(this.session(req), ['owner']);
    return this.tenancy.disconnectBranchWhatsApp(branchId);
  }

  private session(req: Request) {
    const s = this.auth.getCurrentSessionFromCookieHeader(req.headers.cookie);
    if (!s) throw new UnauthorizedException('Authentication required.');
    return s.user;
  }
}
