import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccessService } from './access.service';
import { BasIpSyncService } from './bas-ip-sync.service';
import { BasIpController } from './adapters/bas-ip.controller';

@Module({
  imports: [AuthModule],
  controllers: [BasIpController],
  providers: [AccessService, BasIpSyncService],
  exports: [BasIpSyncService],
})
export class AccessModule {}
