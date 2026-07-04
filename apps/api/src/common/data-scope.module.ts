import { Module } from '@nestjs/common';
import { SettingsModule } from '../modules/settings/settings.module';
import { DataScopeService } from './data-scope.service';

@Module({
  imports: [SettingsModule],
  providers: [DataScopeService],
  exports: [DataScopeService],
})
export class DataScopeModule {}
