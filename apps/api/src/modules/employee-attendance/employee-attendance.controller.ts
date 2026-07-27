import {
  BadRequestException,
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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { requireRole } from '../../common/require-role';
import { DataScopeService } from '../../common/data-scope.service';
import { AuthService } from '../auth/auth.service';
import { EmployeeAttendanceService } from './employee-attendance.service';

type CheckInRequestBody = {
  employeeIdentifier?: string;
  accessMethod?: 'manual' | 'qr' | 'rfid';
};

type SetGatesRequestBody = {
  allowAllGates?: boolean;
  gateIds?: string[];
};

@Controller('employee-attendance')
export class EmployeeAttendanceController {
  constructor(
    private readonly authService: AuthService,
    private readonly employeeAttendanceService: EmployeeAttendanceService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Post('check-in')
  @HttpCode(200)
  async checkIn(@Req() request: Request, @Body() body: CheckInRequestBody) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return this.employeeAttendanceService.checkIn(
      session.user.tenant.id,
      session.user.branch.id,
      body,
    );
  }

  @Post('check-out/:visitId')
  @HttpCode(200)
  async checkOut(
    @Req() request: Request,
    @Param('visitId') visitId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      visit: await this.employeeAttendanceService.checkOut(
        session.user.tenant.id,
        session.user.branch.id,
        visitId,
      ),
    };
  }

  @Get('visits')
  async listVisits(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return {
      visits: await this.employeeAttendanceService.listVisitsForScope(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  @Get('attendance-report')
  async getAttendanceReport(
    @Req() request: Request,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    if (!dateFrom || !dateTo) {
      throw new BadRequestException('dateFrom and dateTo are required.');
    }
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return this.employeeAttendanceService.getAttendanceReport(
      session.user.tenant.id,
      branchId,
      dateFrom,
      dateTo,
    );
  }

  @Get(':employeeId/visits')
  async listEmployeeVisits(
    @Req() request: Request,
    @Param('employeeId') employeeId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      visits: await this.employeeAttendanceService.listVisitsForEmployee(
        session.user.tenant.id,
        employeeId,
      ),
    };
  }

  @Get(':employeeId/gates')
  async getEmployeeGates(
    @Req() request: Request,
    @Param('employeeId') employeeId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return this.employeeAttendanceService.getEmployeeGates(
      session.user.tenant.id,
      employeeId,
    );
  }

  @Patch(':employeeId/gates')
  async setEmployeeGates(
    @Req() request: Request,
    @Param('employeeId') employeeId: string,
    @Body() body: SetGatesRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);
    return this.employeeAttendanceService.setEmployeeGates(
      session.user.tenant.id,
      employeeId,
      {
        allowAllGates: body.allowAllGates ?? true,
        gateIds: body.gateIds ?? [],
      },
    );
  }

  // GET /:employeeId/qrcode — session-protected PNG for display in the web app
  @Get(':employeeId/qrcode')
  async getEmployeeQrCode(
    @Req() request: Request,
    @Param('employeeId') employeeId: string,
    @Res() res: Response,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const buffer = await this.employeeAttendanceService.getEmployeeQrCodeBuffer(
      session.user.tenant.id,
      employeeId,
    );
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(buffer);
  }

  // GET /:employeeId/qrcode/public?sig=<hmac> — no session, HMAC-signed
  @Get(':employeeId/qrcode/public')
  async getEmployeeQrCodePublic(
    @Param('employeeId') employeeId: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ) {
    if (!this.employeeAttendanceService.verifyQrSig(employeeId, sig ?? '')) {
      throw new UnauthorizedException('Invalid or missing signature.');
    }
    const buffer =
      await this.employeeAttendanceService.getEmployeeQrCodeBufferById(
        employeeId,
      );
    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="employee-qr.png"',
    );
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(buffer);
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
