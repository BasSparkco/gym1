import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { ClassBookingsService } from './class-bookings.service';

@Controller('class-bookings')
export class ClassBookingsController {
  constructor(
    private readonly authService: AuthService,
    private readonly classBookingsService: ClassBookingsService,
  ) {}

  @Get('session/:classSessionId')
  async listBookingsForSession(
    @Req() request: Request,
    @Param('classSessionId') classSessionId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      bookings: await this.classBookingsService.listBookingsForSession(
        session.user.tenant.id,
        classSessionId,
      ),
    };
  }

  @Get('member/:memberId')
  async listBookingsForMember(
    @Req() request: Request,
    @Param('memberId') memberId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      bookings: await this.classBookingsService.listBookingsForMember(
        session.user.tenant.id,
        memberId,
      ),
    };
  }

  @Post()
  async bookClass(
    @Req() request: Request,
    @Body() body: { classSessionId?: string; memberId?: string },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      booking: await this.classBookingsService.bookClass(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Post(':bookingId/cancel')
  async cancelBooking(
    @Req() request: Request,
    @Param('bookingId') bookingId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    return {
      booking: await this.classBookingsService.cancelBooking(
        session.user.tenant.id,
        bookingId,
      ),
    };
  }

  @Post(':bookingId/attendance')
  async markAttendance(
    @Req() request: Request,
    @Param('bookingId') bookingId: string,
    @Body() body: { status?: 'attended' | 'noShow' },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    if (body.status !== 'attended' && body.status !== 'noShow') {
      throw new BadRequestException(
        "Status must be 'attended' or 'noShow'.",
      );
    }
    return {
      booking: await this.classBookingsService.markAttendance(
        session.user.tenant.id,
        bookingId,
        body.status,
      ),
    };
  }

  private async getRequiredSession(cookieHeader: string | undefined) {
    const session =
      await this.authService.getCurrentSessionFromCookieHeader(cookieHeader);
    if (!session) throw new UnauthorizedException('Authentication required.');
    return session;
  }
}
