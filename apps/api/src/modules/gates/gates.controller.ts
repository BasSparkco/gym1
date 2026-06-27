import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { AuthService } from '../auth/auth.service';
import { CreateGateInput, GatesService, UpdateGateInput } from './gates.service';

type CreateGateBody = {
  branchId?: string;
  name?: string;
  genderRestriction?: 'male' | 'female' | null;
  deviceUrl?: string;
  deviceUsername?: string;
  devicePassword?: string;
  lockNumber?: number;
  enabled?: boolean;
};

@Controller('gates')
export class GatesController {
  constructor(
    private readonly authService: AuthService,
    private readonly gatesService: GatesService,
  ) {}

  @Get()
  listGates(@Req() req: Request, @Query('branchId') branchId?: string) {
    const session = this.getRequiredSession(req.headers.cookie);
    requireRole(session.user, ['owner', 'manager', 'front-desk']);

    const gates = this.gatesService.listGates(
      session.user.tenant.id,
      branchId,
    );
    return { gates: gates.map(this.sanitize) };
  }

  @Post()
  createGate(@Req() req: Request, @Body() body: CreateGateBody) {
    const session = this.getRequiredSession(req.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    const input: CreateGateInput = {
      branchId: body.branchId ?? session.user.branch.id,
      name: body.name ?? '',
      genderRestriction: body.genderRestriction ?? null,
      deviceUrl: body.deviceUrl ?? '',
      deviceUsername: body.deviceUsername ?? 'admin',
      devicePassword: body.devicePassword ?? '',
      lockNumber: body.lockNumber,
      enabled: body.enabled,
    };
    const gate = this.gatesService.createGate(session.user.tenant.id, input);
    return { gate: this.sanitize(gate) };
  }

  @Patch(':gateId')
  updateGate(
    @Req() req: Request,
    @Param('gateId') gateId: string,
    @Body() body: CreateGateBody,
  ) {
    const session = this.getRequiredSession(req.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    const input: UpdateGateInput = {};
    if (body.branchId != null) input.branchId = body.branchId;
    if (body.name != null) input.name = body.name;
    if (body.genderRestriction !== undefined)
      input.genderRestriction = body.genderRestriction;
    if (body.deviceUrl != null) input.deviceUrl = body.deviceUrl;
    if (body.deviceUsername != null) input.deviceUsername = body.deviceUsername;
    if (body.devicePassword != null) input.devicePassword = body.devicePassword;
    if (body.lockNumber != null) input.lockNumber = body.lockNumber;
    if (body.enabled != null) input.enabled = body.enabled;

    const gate = this.gatesService.updateGate(
      session.user.tenant.id,
      gateId,
      input,
    );
    return { gate: this.sanitize(gate) };
  }

  @Delete(':gateId')
  @HttpCode(200)
  deleteGate(@Req() req: Request, @Param('gateId') gateId: string) {
    const session = this.getRequiredSession(req.headers.cookie);
    requireRole(session.user, ['owner']);

    this.gatesService.deleteGate(session.user.tenant.id, gateId);
    return { deleted: true };
  }

  // -------------------------------------------------------------------------

  private getRequiredSession(cookie: string | undefined) {
    const session = this.authService.getCurrentSessionFromCookieHeader(cookie);
    if (!session) throw new UnauthorizedException('Authentication required.');
    return session;
  }

  /** Password is write-only; URL and username are returned so the edit form can pre-fill them. */
  private sanitize(gate: ReturnType<GatesService['getGate']>) {
    if (!gate) return null;
    const { devicePassword, ...safe } = gate;
    return {
      ...safe,
      hasDevice: !!(safe.deviceUrl && safe.deviceUsername && devicePassword),
    };
  }
}
