import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccessModule } from '../access/access.module';
import { DataScopeModule } from '../../common/data-scope.module';
import { EmployeeAttendanceController } from './employee-attendance.controller';
import { EmployeeAttendanceService } from './employee-attendance.service';

@Module({
  imports: [AuthModule, AccessModule, DataScopeModule],
  controllers: [EmployeeAttendanceController],
  providers: [EmployeeAttendanceService],
  exports: [EmployeeAttendanceService],
})
export class EmployeeAttendanceModule {}
