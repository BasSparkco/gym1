import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DataScopeModule } from '../../common/data-scope.module';
import { ClosedDatesController } from './closed-dates.controller';
import { ClosedDatesService } from './closed-dates.service';

@Module({
  imports: [AuthModule, DataScopeModule],
  controllers: [ClosedDatesController],
  providers: [ClosedDatesService],
  exports: [ClosedDatesService],
})
export class ClosedDatesModule {}
