import { Injectable } from '@nestjs/common';
import type { SessionUser } from '../modules/auth/auth.service';
import { SettingsService } from '../modules/settings/settings.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Resolves how much of the tenant a given request should see.
 *
 * Only the owner role can switch branches (see BranchesController#switchBranch),
 * so only the owner's view is affected by the tenant's `ownerDataScope`
 * preference. Every other role stays scoped to the single branch on their
 * user record, exactly as before this preference existed.
 */
@Injectable()
export class DataScopeService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  /** Returns undefined when the caller should see every branch in the
   * tenant, or the branchId to filter by otherwise. */
  async resolveBranchId(user: SessionUser): Promise<string | undefined> {
    if (user.role !== 'owner') {
      return user.branch.id;
    }

    const settings = await this.settingsService.getSettingsForTenant(
      user.tenant.id,
    );
    return settings.ownerDataScope === 'activeBranch'
      ? user.branch.id
      : undefined;
  }

  /** The currency a report/screen scoped this way should be shown in: the
   * branch's operating currency when scoped to one branch, otherwise the
   * tenant's reporting currency (used for "all branches" aggregate views). */
  async resolveCurrencyCode(
    user: SessionUser,
    branchId: string | undefined,
  ): Promise<string> {
    if (branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: branchId },
        select: { operatingCurrencyCode: true },
      });

      if (branch) {
        return branch.operatingCurrencyCode;
      }
    }

    const settings = await this.settingsService.getSettingsForTenant(
      user.tenant.id,
    );
    return settings.reportingCurrencyCode;
  }
}
