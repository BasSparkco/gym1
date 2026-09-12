import { Controller, HttpCode, Logger, Post, Put, Req, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { AccessMethod } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessService } from '../access.service';

/**
 * Receiver for BAS-IP's "Link" management protocol (device's Network tab ->
 * Management system, distinct from the Access management -> Server manage
 * access real-time decision path in bas-ip.controller.ts). The device
 * decides access locally first (fast door — no round trip to us) and
 * reports the outcome here afterward, so this only ever *logs* a Visit —
 * it never grants or denies anything. See gates.md for the full writeup.
 *
 * Handshake (reverse-engineered from live devices 2026-09-12, undocumented
 * by BAS-IP for the HTTP variant):
 *  1. POST /api/v0/devices/login  {"login": "<serial_number>", "password": "<BASIP_LINK_PASSWORD>"}
 *     -> {"token": "<uuid>"}
 *  2. PUT /api/v0/devices/logs  (Authorization: Bearer <token>)
 *     body: {"events": [{created_at, category, code, info: {...}}, ...]}
 *  3. POST /api/v0/devices/pong every ~10s (heartbeat) and occasional
 *     POST /api/v0/devices/refresh — both harmless, just acknowledged.
 *
 * None of these calls reliably set a Content-Type header, so main.ts reads
 * this whole path as raw text and every handler here JSON.parses it itself.
 */
@Controller('access/bas-ip-link')
export class BasIpLinkController {
  private readonly logger = new Logger(BasIpLinkController.name);

  // token -> which gate authenticated with it. In-memory only: sessions are
  // short-lived (the device re-logs in frequently) and a restart just means
  // the next login re-establishes one — no need to persist this.
  private readonly sessions = new Map<
    string,
    { gateId: string; branchId: string; tenantId: string }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: AccessService,
  ) {}

  @Post('api/v0/devices/login')
  @HttpCode(200)
  async login(@Req() request: Request) {
    const body = this.parseBody(request.body);
    const serial = typeof body?.login === 'string' ? body.login : undefined;
    const password = typeof body?.password === 'string' ? body.password : undefined;

    const expected = process.env.BASIP_LINK_PASSWORD;
    if (!expected || password !== expected) {
      this.logger.warn(`bas-ip-link login rejected: bad password (serial=${serial})`);
      throw new UnauthorizedException();
    }

    const gate = serial
      ? await this.prisma.gate.findUnique({ where: { linkDeviceSerial: serial } })
      : null;
    if (!gate) {
      this.logger.warn(
        `bas-ip-link login: no Gate has linkDeviceSerial=${serial} — events from this device won't be attributable. Set it in that gate's settings.`,
      );
    }

    const token = randomUUID();
    if (gate) {
      this.sessions.set(token, {
        gateId: gate.id,
        branchId: gate.branchId,
        tenantId: gate.tenantId,
      });
    }
    return { token };
  }

  @Put('api/v0/devices/logs')
  @HttpCode(200)
  async logs(@Req() request: Request) {
    const auth = request.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined;
    const session = token ? this.sessions.get(token) : undefined;
    if (!session) {
      this.logger.warn('bas-ip-link logs: no session for this token, rejecting so the device re-logs in');
      throw new UnauthorizedException();
    }

    const body = this.parseBody(request.body);
    const events: Array<{
      created_at: number;
      category?: string;
      code?: string;
      info?: Record<string, unknown>;
    }> = Array.isArray(body?.events) ? body.events : [];

    let created = 0;
    let skipped = 0;
    for (const event of events) {
      if (event.code !== 'access_granted_by_valid_identifier') continue;

      const info = event.info ?? {};
      const identifier = typeof info.number === 'string' ? info.number : undefined;
      if (!identifier) continue;

      const identifierType: 'card' | 'qr' = info.type === 'card' ? 'card' : 'qr';
      const occurredAt = new Date(event.created_at);

      const wasCreated = await this.recordVisit(session, identifier, identifierType, occurredAt);
      if (wasCreated) created++;
      else skipped++;
    }

    if (created > 0 || skipped > 0) {
      this.logger.log(
        `bas-ip-link logs: gate=${session.gateId} processed=${events.length} visitsCreated=${created} skipped=${skipped}`,
      );
    }
    return { status: 'ok' };
  }

  @Post('api/v0/devices/pong')
  @HttpCode(200)
  pong() {
    return { status: 'ok' };
  }

  @Post('api/v0/devices/refresh')
  @HttpCode(200)
  refresh() {
    return { status: 'ok' };
  }

  /** Returns true if a new Visit/EmployeeVisit was created, false if skipped (already checked in, or unknown identifier). */
  private async recordVisit(
    session: { gateId: string; branchId: string; tenantId: string },
    identifier: string,
    identifierType: 'card' | 'qr',
    occurredAt: Date,
  ): Promise<boolean> {
    const accessMethod: AccessMethod = identifierType === 'card' ? 'rfid' : 'qr';
    const dayRange = this.dayRangeUtc(occurredAt);

    const member = await this.accessService.resolveMember(
      session.tenantId,
      identifier,
      identifierType,
    );
    if (member) {
      const alreadyOpen = await this.prisma.visit.findFirst({
        where: {
          memberId: member.id,
          branchId: session.branchId,
          checkOutTime: null,
          checkInTime: dayRange,
        },
      });
      if (alreadyOpen) return false;

      await this.prisma.visit.create({
        data: {
          id: `visit-${randomUUID()}`,
          memberId: member.id,
          branchId: session.branchId,
          gateId: session.gateId,
          checkInTime: occurredAt,
          checkOutTime: null,
          accessMethod,
        },
      });
      return true;
    }

    const employee = await this.accessService.resolveEmployee(
      session.tenantId,
      identifier,
      identifierType,
    );
    if (employee) {
      const alreadyOpen = await this.prisma.employeeVisit.findFirst({
        where: {
          employeeId: employee.id,
          branchId: session.branchId,
          checkOutTime: null,
          checkInTime: dayRange,
        },
      });
      if (alreadyOpen) return false;

      await this.prisma.employeeVisit.create({
        data: {
          id: `employee-visit-${randomUUID()}`,
          employeeId: employee.id,
          branchId: session.branchId,
          gateId: session.gateId,
          checkInTime: occurredAt,
          checkOutTime: null,
          accessMethod,
        },
      });
      return true;
    }

    this.logger.warn(`bas-ip-link logs: identifier ${identifier} matched no member or employee`);
    return false;
  }

  private dayRangeUtc(d: Date): { gte: Date; lt: Date } {
    const gte = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
    return { gte, lt };
  }

  private parseBody(body: unknown): any {
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return {};
      }
    }
    return body ?? {};
  }
}
