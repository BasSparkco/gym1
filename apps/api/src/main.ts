import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true keeps the raw request Buffer around (in req.rawBody)
  // alongside Nest's normal parsed body — needed to verify the SparkCo
  // webhook's HMAC signature, which is computed over the exact bytes sent.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // TEMPORARY (2026-09-12): the BAS-IP panel's "Link" protocol calls this
  // prefix without a Content-Type header on several of its endpoints
  // (/api/v0/devices/logs in particular), so none of Nest's default
  // json/urlencoded parsers pick it up and req.body ends up undefined.
  // Read everything under this path as raw text ourselves, regardless of
  // Content-Type; handlers JSON.parse it themselves. No extra dependency —
  // just consumes the request stream directly. Remove once
  // bas-ip-link.controller.ts is no longer a diagnostic receiver.
  app.use('/api/access/bas-ip-link', (req: Request, _res: Response, next: NextFunction) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => (data += chunk));
    req.on('end', () => {
      (req as Request & { body: string }).body = data;
      next();
    });
  });

  // Traefik terminates TLS one hop in front of us; trust it so req.ip is the
  // real client address (sign-in throttling keys on it).
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
