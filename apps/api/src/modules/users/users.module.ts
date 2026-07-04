import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DataScopeModule } from '../../common/data-scope.module';
import { UsersController } from './users.controller';

@Module({
  imports: [AuthModule, DataScopeModule],
  controllers: [UsersController],
})
export class UsersModule {}
