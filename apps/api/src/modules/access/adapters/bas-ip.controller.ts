import {
  Body,
  Controller,
  HttpCode,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { readOperationsStore } from '../../../data/operations-store';
import { AuthService } from '../../auth/auth.service';
import { AccessService } from '../access.service';
import { BasIpSyncService } from '../bas-ip-sync.service';
import { BasIpDeviceGuard } from './bas-ip.guard';

/**
 * BAS-IP Remote Access Server adapter.
 *
 * Configure each gate device at:
 *   Settings → Access → Remote Access Server → Custom server URL:
 *   https://<domain>/api/access/bas-ip?branchId=<branchId>&gateId=<gateId>&token=<DEVICE_TOKEN>
 *
 * The gateId query param identifies which gate is calling so we can enforce
 * gender restrictions and log which gate the member entered through.
 *
 * Device sends POST with JSON body; we respond within 10 s or the device
 * falls back to its local access list.
 */

type BasIpRequestBody = {
  identifier_number?: string;
  identifier_type?: 'card' | 'input_code' | 'qr';
};

type OpenGateBody = {
  gateId?: string;
};

@Controller('access')
export class BasIpController {
  constructor(
    private readonly accessService: AccessService,
    private readonly basIpSyncService: BasIpSyncService,
    private readonly authService: AuthService,
  ) {}

  @Post('gate/open')
  @HttpCode(200)
  async openGate(@Req() request: Request, @Body() body: OpenGateBody) {
    const session = this.authService.getCurrentSessionFromCookieHeader(
      request.headers.cookie,
    );
    if (!session) throw new UnauthorizedException('Authentication required.');

    if (body.gateId) {
      const store = readOperationsStore();
      const gate = store.gates.find(
        (g) =>
          g.id === body.gateId && g.tenantId === session.user.tenant.id,
      );
      if (!gate) {
        return { opened: false, reason: 'Gate not found.' };
      }
      return this.basIpSyncService.openGate(gate);
    }

    // No gateId — fall back to legacy single-device env vars
    return this.basIpSyncService.openGate();
  }

  @Post('bas-ip')
  @HttpCode(200)
  @UseGuards(BasIpDeviceGuard)
  handleAccess(
    @Body() body: BasIpRequestBody,
    @Query('branchId') branchId: string,
    @Query('gateId') gateId?: string,
  ) {
    const identifierNumber = body.identifier_number?.trim();
    const identifierType = body.identifier_type;

    if (
      !identifierNumber ||
      !identifierType ||
      !['card', 'input_code', 'qr'].includes(identifierType)
    ) {
      return { handled: true, access: { granted: false } };
    }

    if (!branchId) {
      return { handled: true, access: { granted: false } };
    }

    const result = this.accessService.checkAccess(
      identifierNumber,
      identifierType,
      branchId,
      gateId,
    );

    if (!result.granted) {
      return { handled: true, access: { granted: false } };
    }

    // Resolve the lock number from the gate config if available
    let lockNumber = 1;
    if (gateId) {
      const store = readOperationsStore();
      const gate = store.gates.find((g) => g.id === gateId);
      if (gate) lockNumber = gate.lockNumber;
    }

    return { handled: true, access: { granted: true, lock_number: lockNumber } };
  }
}
