import "server-only";

import { getBranch } from "@/lib/branches";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";

/** The currency symbol to show on a money display: the given branch's
 * operating currency if provided, otherwise the tenant's reporting
 * currency. Pass the session's active branch id for "current branch"
 * screens (memberships, payments, plans, salaries). */
export async function getActiveCurrencySymbol(
  branchId?: string,
): Promise<string> {
  if (branchId) {
    const branch = await getBranch(branchId).catch(() => null);
    if (branch?.operatingCurrencyCode) {
      return getCurrencySymbol(branch.operatingCurrencyCode);
    }
  }

  const settings = await getSettings();
  return getCurrencySymbol(settings.reportingCurrencyCode);
}
