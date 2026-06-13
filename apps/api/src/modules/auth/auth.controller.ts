import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

type SignInRequestBody = {
  identifier?: string;
  password?: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(200)
  signIn(
    @Body() body: SignInRequestBody,
    @Res({ passthrough: true }) response: Response,
  ) {
    const identifier = body.identifier?.trim();
    const password = body.password ?? '';

    if (!identifier || !password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const session = this.authService.signIn({ identifier, password });

    if (!session) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    response.cookie(this.authService.getSessionCookieName(), session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 1000 * 60 * 60 * 12,
    });

    return {
      user: session.user,
    };
  }

  @Get('current-session')
  getCurrentSession(@Req() request: Request) {
    const session = this.authService.getCurrentSessionFromCookieHeader(
      request.headers.cookie,
    );

    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }

    return {
      user: session.user,
    };
  }

  @Post('sign-out')
  @HttpCode(204)
  signOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = this.authService.getCurrentSessionFromCookieHeader(
      request.headers.cookie,
    );

    this.authService.clearSession(session?.token);
    response.clearCookie(this.authService.getSessionCookieName(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }
}
