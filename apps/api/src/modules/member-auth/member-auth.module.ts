import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { MembersModule } from '../members/members.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { ClosedDatesModule } from '../closed-dates/closed-dates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';
import { MemberActivityModule } from '../member-activity/member-activity.module';
import { MemberAuthController } from './member-auth.controller';
import { MeController } from './me.controller';
import { MemberAuthService } from './member-auth.service';

@Module({
  imports: [
    MembersModule,
    MembershipsModule,
    AnnouncementsModule,
    ClosedDatesModule,
    NotificationsModule,
    MessagesModule,
    MemberActivityModule,
    // Same reasoning as AuthModule: brute-force protection scoped to just
    // the member sign-in route, so only it pays the throttling cost.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 10 }],
    }),
  ],
  controllers: [MemberAuthController, MeController],
  providers: [MemberAuthService],
})
export class MemberAuthModule {}
