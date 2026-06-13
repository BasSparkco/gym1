import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MembersModule } from '../members/members.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { PaymentsModule } from '../payments/payments.module';
import { VisitsModule } from '../visits/visits.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    AuthModule,
    MembersModule,
    MembershipsModule,
    PaymentsModule,
    VisitsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
