import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true keeps the raw request Buffer around (in req.rawBody)
  // alongside Nest's normal parsed body — needed to verify the SparkCo
  // webhook's HMAC signature, which is computed over the exact bytes sent.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Traefik terminates TLS one hop in front of us; trust it so req.ip is the
  // real client address (sign-in throttling keys on it).
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001',
    credentials: true,
  });
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
