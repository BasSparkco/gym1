import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { MembersModule } from '../members/members.module';
import { MemberAuthController } from './member-auth.controller';
import { MeController } from './me.controller';
import { MemberAuthService } from './member-auth.service';

@Module({
  imports: [
    MembersModule,
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
