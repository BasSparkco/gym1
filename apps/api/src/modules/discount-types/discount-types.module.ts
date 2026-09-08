import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DiscountTypesController } from './discount-types.controller';
import { DiscountTypesService } from './discount-types.service';

@Module({
  imports: [AuthModule],
  controllers: [DiscountTypesController],
  providers: [DiscountTypesService],
  exports: [DiscountTypesService],
})
export class DiscountTypesModule {}
