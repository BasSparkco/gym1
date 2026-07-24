import { Module } from '@nestjs/common';
import { DebtService } from './debt.service';

@Module({
  providers: [DebtService],
  exports: [DebtService],
})
export class DebtModule {}
