"use client";

import type { Branch } from "@/lib/branches";
import type { Dict } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/countries";
import { CURRENCIES } from "@/lib/currencies";
import { Card } from "@/components/ui/card";
import { PhoneNumber } from "@/components/phone-number";
import WhatsAppCard from "@/app/app/branches/[branchId]/WhatsAppCard";

// The single canonical shape a branch detail view is built from. Both the
// dedicated /app/branches/[branchId] page and the branches-list inline
// expansion (BranchesGrid) render through this component, so the two never
// drift apart again.
type Props = {
  branch: Branch;
  canManage: boolean;
  t: Dict;
};

export function BranchDetailView({ branch, canManage, t }: Props) {
  const countryName = branch.countryCode
    ? (COUNTRIES.find((c) => c.code === branch.countryCode)?.name ?? branch.countryCode)
    : null;
  const currency = CURRENCIES.find((c) => c.code === branch.operatingCurrencyCode);

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-2">
        <Card animate delay={1} className="border-s-4 border-s-brand">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">{t.branches.details}</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">Name</dt>
              <dd className="mt-0.5 font-medium">{branch.name}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.branches.address}</dt>
              <dd className="mt-0.5 font-medium">{branch.address ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.branches.phone}</dt>
              <dd className="mt-0.5 font-medium">{branch.phone ? <PhoneNumber value={branch.phone} /> : "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.branches.country}</dt>
              <dd className="mt-0.5 font-medium">{countryName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.branches.currency}</dt>
              <dd className="mt-0.5 font-medium">
                {currency ? `${currency.name} (${currency.symbol})` : branch.operatingCurrencyCode}
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.branches.statusLabel}</dt>
              <dd className="mt-0.5 font-medium capitalize">{branch.status}</dd>
            </div>
          </dl>
        </Card>

        <WhatsAppCard branchId={branch.id} canManage={canManage} t={t} className="border-s-4 border-s-blue-500" />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card animate delay={2} className="border-s-4 border-s-muted">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">System</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.branches.branchId}</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground/70">{branch.id}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.branches.tenantId}</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground/70">{branch.tenantId}</dd>
            </div>
          </dl>
        </Card>
      </section>
    </div>
  );
}
