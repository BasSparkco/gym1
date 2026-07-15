import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LogosController } from './logos.controller';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [AuthModule],
  controllers: [SettingsController, LogosController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
