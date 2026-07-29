import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PlatformAdminAuthController } from './platform-admin-auth.controller';
import { PlatformAdminAuthService } from './platform-admin-auth.service';
import { PlatformAdminTenantsController } from './platform-admin-tenants.controller';
import { PlatformAdminTenantsService } from './platform-admin-tenants.service';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 10 }],
    }),
  ],
  controllers: [PlatformAdminAuthController, PlatformAdminTenantsController],
  providers: [PlatformAdminAuthService, PlatformAdminTenantsService],
})
export class PlatformAdminModule {}
