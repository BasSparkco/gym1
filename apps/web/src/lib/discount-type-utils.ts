// No "server-only" here deliberately — this is imported by client components
// (membership/renewal discount pickers) as well as server pages, unlike the
// data-fetching functions in lib/discount-types.ts.
import type { Lang } from "@/lib/i18n";

export type DiscountType = {
  id: string;
  tenantId: string;
  name: string;
  nameAr: string | null;
  nameHe: string | null;
  description: string | null;
  defaultPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Display name in the current UI language, falling back to the base
 * (English) `name` when no translation was entered for it. */
export function localizedDiscountTypeName(
  type: Pick<DiscountType, "name" | "nameAr" | "nameHe">,
  lang: Lang,
): string {
  if (lang === "ar") return type.nameAr || type.name;
  if (lang === "he") return type.nameHe || type.name;
  return type.name;
}
