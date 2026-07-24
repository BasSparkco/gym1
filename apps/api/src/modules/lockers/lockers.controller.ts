import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { DataScopeService } from '../../common/data-scope.service';
import { AuthService } from '../auth/auth.service';
import { LockersService } from './lockers.service';

type CreateLockerRequestBody = {
  branchId?: string;
  lockerNumber?: string;
  size?: 'small' | 'medium' | 'large' | null;
  monthlyPrice?: number;
};

type UpdateLockerRequestBody = {
  lockerNumber?: string;
  size?: 'small' | 'medium' | 'large' | null;
  monthlyPrice?: number;
  status?: 'available' | 'occupied' | 'maintenance';
};

type CreateLockerRentalRequestBody = {
  lockerId?: string;
  memberId?: string;
  startDate?: string;
  endDate?: string;
  finalPrice?: number;
};

@Controller('lockers')
export class LockersController {
  constructor(
    private readonly authService: AuthService,
    private readonly lockersService: LockersService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get('rentals/member/:memberId')
  async listRentalsForMember(
    @Req() request: Request,
    @Param('memberId') memberId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      rentals: await this.lockersService.listRentalsForMember(
        session.user.tenant.id,
        memberId,
      ),
    };
  }

  @Post('rentals')
  async createRental(
    @Req() request: Request,
    @Body() body: CreateLockerRentalRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      rental: await this.lockersService.createRental(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Post('rentals/:rentalId/cancel')
  async cancelRental(
    @Req() request: Request,
    @Param('rentalId') rentalId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      rental: await this.lockersService.cancelRental(
        session.user.tenant.id,
        rentalId,
      ),
    };
  }

  @Get()
  async listLockers(
    @Req() request: Request,
    @Query('branchId') queryBranchId?: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const scopedBranchId = await this.dataScopeService.resolveBranchId(
      session.user,
    );

    return {
      lockers: await this.lockersService.listLockers(
        session.user.tenant.id,
        scopedBranchId ?? queryBranchId,
      ),
    };
  }

  @Post()
  async createLocker(
    @Req() request: Request,
    @Body() body: CreateLockerRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      locker: await this.lockersService.createLocker(
        session.user.tenant.id,
        {
          branchId: body.branchId ?? session.user.branch.id,
          lockerNumber: body.lockerNumber,
          size: body.size,
          monthlyPrice: body.monthlyPrice,
        },
      ),
    };
  }

  @Get(':lockerId')
  async getLocker(@Req() request: Request, @Param('lockerId') lockerId: string) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      locker: await this.lockersService.getLockerForTenant(
        session.user.tenant.id,
        lockerId,
      ),
    };
  }

  @Patch(':lockerId')
  async updateLocker(
    @Req() request: Request,
    @Param('lockerId') lockerId: string,
    @Body() body: UpdateLockerRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      locker: await this.lockersService.updateLocker(
        session.user.tenant.id,
        lockerId,
        body,
      ),
    };
  }

  @Delete(':lockerId')
  @HttpCode(200)
  async deleteLocker(
    @Req() request: Request,
    @Param('lockerId') lockerId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner']);

    await this.lockersService.deleteLocker(session.user.tenant.id, lockerId);
    return { deleted: true };
  }

  private async getRequiredSession(cookieHeader: string | undefined) {
    const session =
      await this.authService.getCurrentSessionFromCookieHeader(cookieHeader);

    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }

    return session;
  }
}
