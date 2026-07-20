import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { MemberAuthService } from './member-auth.service';
import { extractBearerToken } from './extract-bearer-token';

type MemberSignInRequestBody = {
  identifier?: string;
  pin?: string;
};

@Controller('member-auth')
export class MemberAuthController {
  constructor(private readonly memberAuthService: MemberAuthService) {}

  @Post('sign-in')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async signIn(@Body() body: MemberSignInRequestBody) {
    const identifier = body.identifier?.trim();
    const pin = body.pin ?? '';

    if (!identifier || !pin) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const result = await this.memberAuthService.signIn(identifier, pin);
    if (!result) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return result;
  }

  @Get('current-session')
  async getCurrentSession(@Req() request: Request) {
    const member = await this.memberAuthService.getCurrentSession(
      extractBearerToken(request.headers.authorization),
    );
    if (!member) {
      throw new UnauthorizedException('Authentication required.');
    }
    return { member };
  }

  @Post('sign-out')
  @HttpCode(204)
  async signOut(@Req() request: Request) {
    await this.memberAuthService.signOut(
      extractBearerToken(request.headers.authorization),
    );
  }
}
