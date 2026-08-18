import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DataScopeModule } from '../../common/data-scope.module';
import { EmployeeAttendanceModule } from '../employee-attendance/employee-attendance.module';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  imports: [AuthModule, DataScopeModule, EmployeeAttendanceModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
