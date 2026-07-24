import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClassBookingsController } from './class-bookings.controller';
import { ClassBookingsService } from './class-bookings.service';

@Module({
  imports: [AuthModule],
  controllers: [ClassBookingsController],
  providers: [ClassBookingsService],
  exports: [ClassBookingsService],
})
export class ClassBookingsModule {}

