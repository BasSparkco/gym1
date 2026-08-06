import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { requireRole } from '../../common/require-role';
import { AuthService } from '../auth/auth.service';
import { MinioService } from '../../minio/minio.service';
import { validateImageUpload } from '../../common/image-upload';
import { BranchesService } from './branches.service';

type CreateBranchRequestBody = {
  name?: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  operatingCurrencyCode?: string;
  status?: 'active' | 'inactive';
};

type UpdateBranchRequestBody = {
  name?: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  operatingCurrencyCode?: string;
  status?: 'active' | 'inactive';
};

@Controller('branches')
export class BranchesController {
  constructor(
    private readonly authService: AuthService,
    private readonly branchesService: BranchesService,
    private readonly minioService: MinioService,
  ) {}

  @Get()
  async listBranches(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      branches: await this.branchesService.listBranchesForTenant(
        session.user.tenant.id,
      ),
    };
  }

  @Post()
  async createBranch(
    @Req() request: Request,
    @Body() body: CreateBranchRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      branch: await this.branchesService.createBranch(
        session.user.tenant.id,
        body,
      ),
    };
  }

  @Get(':branchId')
  async getBranch(
    @Req() request: Request,
    @Param('branchId') branchId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);

    return {
      branch: await this.branchesService.getBranchForTenant(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  @Patch(':branchId')
  async updateBranch(
    @Req() request: Request,
    @Param('branchId') branchId: string,
    @Body() body: UpdateBranchRequestBody,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    const branch = await this.branchesService.updateBranch(
      session.user.tenant.id,
      branchId,
      body,
    );

    if (body.name !== undefined) {
      await this.authService.syncBranchNameForUsers(
        session.user.tenant.id,
        branchId,
        branch.name,
      );
    }

    return { branch };
  }

  // Uses memory storage (default) — file is uploaded to MinIO object storage,
  // same pattern as MembersController.uploadMemberPhoto.
  @Post(':branchId/logo')
  @UseInterceptors(
    FileInterceptor('logo', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadBranchLogo(
    @Req() request: Request,
    @Param('branchId') branchId: string,
    @UploadedFile()
    file: { originalname: string; buffer: Buffer; mimetype: string },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    const { extension, contentType } = validateImageUpload(file);
    const filename = `logo-branch-${Date.now()}-${Math.round(Math.random() * 1e6)}${extension}`;
    await this.minioService.client.putObject(
      this.minioService.getBucket(),
      filename,
      file.buffer,
      file.buffer.length,
      { 'Content-Type': contentType },
    );

    return {
      branch: await this.branchesService.updateBranchLogo(
        session.user.tenant.id,
        branchId,
        `/api/uploads/logos/${filename}`,
      ),
    };
  }

  @Delete(':branchId/logo')
  async removeBranchLogo(
    @Req() request: Request,
    @Param('branchId') branchId: string,
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner', 'manager']);

    return {
      branch: await this.branchesService.updateBranchLogo(
        session.user.tenant.id,
        branchId,
        null,
      ),
    };
  }

  @Post('switch')
  async switchBranch(
    @Req() request: Request,
    @Body() body: { branchId?: string },
  ) {
    const session = await this.getRequiredSession(request.headers.cookie);
    requireRole(session.user, ['owner']);

    if (!body.branchId) {
      throw new BadRequestException('branchId is required.');
    }

    const branch = await this.branchesService.getBranchForTenant(
      session.user.tenant.id,
      body.branchId,
    );

    const user = await this.authService.switchBranchForUser(
      session.user.tenant.id,
      session.user.id,
      branch.id,
      branch.name,
    );

    return { user };
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
