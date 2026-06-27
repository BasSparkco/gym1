import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GatesController } from './gates.controller';
import { GatesService } from './gates.service';

@Module({
  imports: [AuthModule],
  controllers: [GatesController],
  providers: [GatesService],
  exports: [GatesService],
})
export class GatesModule {}
