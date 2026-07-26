import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccessModule } from './modules/access/access.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ClosedDatesModule } from './modules/closed-dates/closed-dates.module';
import { ClassBookingsModule } from './modules/class-bookings/class-bookings.module';
import { ClassSessionsModule } from './modules/class-sessions/class-sessions.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { GatesModule } from './modules/gates/gates.module';
import { LockersModule } from './modules/lockers/lockers.module';
import { MemberAuthModule } from './modules/member-auth/member-auth.module';
import { MembersModule } from './modules/members/members.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { TrainingProgramsModule } from './modules/training-programs/training-programs.module';
import { UsersModule } from './modules/users/users.module';
import { VisitsModule } from './modules/visits/visits.module';
import { MinioModule } from './minio/minio.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    MinioModule,
    ScheduleModule.forRoot(),
    AuthModule,
    TenancyModule,
    BranchesModule,
    EmployeesModule,
    GatesModule,
    UsersModule,
    MembersModule,
    MemberAuthModule,
    MembershipsModule,
    PaymentsModule,
    VisitsModule,
    NotificationsModule,
    ReportsModule,
    SettingsModule,
    AccessModule,
    TrainingProgramsModule,
    ClassSessionsModule,
    ClassBookingsModule,
    LockersModule,
    AnnouncementsModule,
    ClosedDatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
