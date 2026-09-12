import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccessService } from './access.service';
import { BasIpSyncService } from './bas-ip-sync.service';
import { BasIpController } from './adapters/bas-ip.controller';
import { BasIpLinkController } from './adapters/bas-ip-link.controller';

@Module({
  imports: [AuthModule],
  controllers: [BasIpController, BasIpLinkController],
  providers: [AccessService, BasIpSyncService],
  exports: [BasIpSyncService],
})
export class AccessModule {}
