import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AreasModule } from '../areas/areas.module';
import { AuthModule } from '../auth/auth.module';
import { DataScopeModule } from '../../common/data-scope.module';
import { DebtModule } from '../debt/debt.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';
import { SettingsModule } from '../settings/settings.module';
import { MemberPhotosController } from './member-photos.controller';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { MemberAuthService } from '../member-auth/member-auth.service';

@Module({
  imports: [
    AccessModule,
    AreasModule,
    AuthModule,
    DataScopeModule,
    DebtModule,
    NotificationsModule,
    MessagesModule,
    SettingsModule,
  ],
  // MemberAuthService is provided directly here (not via MemberAuthModule)
  // because MemberAuthModule itself imports MembersModule for member-facing
  // routes — importing it back would be a circular module dependency. Its
  // own deps (Prisma, Redis) are global providers, so a second instance
  // here is cheap and stateless.
  controllers: [MembersController, MemberPhotosController],
  providers: [MembersService, MemberAuthService],
  exports: [MembersService],
})
export class MembersModule {}
