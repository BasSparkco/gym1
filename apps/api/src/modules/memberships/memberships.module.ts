import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { DebtModule } from '../debt/debt.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DataScopeModule } from '../../common/data-scope.module';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [AccessModule, AuthModule, NotificationsModule, DataScopeModule, DebtModule],
  controllers: [MembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
