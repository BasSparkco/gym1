import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DataScopeModule } from '../../common/data-scope.module';
import { ClassSessionsModule } from '../class-sessions/class-sessions.module';
import { DebtModule } from '../debt/debt.module';
import { TrainingProgramsController } from './training-programs.controller';
import { TrainingProgramsService } from './training-programs.service';

@Module({
  imports: [AuthModule, DataScopeModule, ClassSessionsModule, DebtModule],
  controllers: [TrainingProgramsController],
  providers: [TrainingProgramsService],
  exports: [TrainingProgramsService],
})
export class TrainingProgramsModule {}
