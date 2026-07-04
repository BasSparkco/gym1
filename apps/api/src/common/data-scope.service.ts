import { Injectable } from '@nestjs/common';
import type { SessionUser } from '../modules/auth/auth.service';
import { SettingsService } from '../modules/settings/settings.service';

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
  constructor(private readonly settingsService: SettingsService) {}

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
}
