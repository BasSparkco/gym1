import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { DataScopeModule } from '../../common/data-scope.module';
import { DebtModule } from '../debt/debt.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';
import { MemberPhotosController } from './member-photos.controller';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [
    AccessModule,
    AuthModule,
    DataScopeModule,
    DebtModule,
    NotificationsModule,
    MessagesModule,
  ],
  controllers: [MembersController, MemberPhotosController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
