import { getBranch } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings, getLogoUrl } from "@/lib/settings";
import { COUNTRIES } from "@/lib/countries";
import { CURRENCIES } from "@/lib/currencies";
import WhatsAppCard from "./WhatsAppCard";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneNumber } from "@/components/phone-number";
import { PencilLine } from "lucide-react";

type Props = {
  params: Promise<{ branchId: string }>;
};

export default async function BranchDetailPage({ params }: Props) {
  const { branchId } = await params;
  const session = await requireSession();
  const t = await getT();
  const [branch, settings] = await Promise.all([getBranch(branchId), getSettings()]);
  const canManage = session.role === "owner" || session.role === "manager";
  const countryName = branch.countryCode
    ? (COUNTRIES.find((c) => c.code === branch.countryCode)?.name ?? branch.countryCode)
    : null;
  const currency = CURRENCIES.find((c) => c.code === branch.operatingCurrencyCode);
  const logoUrl = getLogoUrl(settings.logoMode === "perBranch" ? branch.logoUrl : settings.logoUrl);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.branches}
        title={
          <span className="flex items-center gap-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-9 w-9 rounded-lg border border-line bg-white object-contain p-1"
              />
            )}
            {branch.name}
            <Badge tone={branch.status === "active" ? "success" : "neutral"}>
              {branch.status === "active" ? t.status.active : t.status.inactive}
            </Badge>
          </span>
        }
        actions={
          <>
            {canManage && (
              <Button
                href={`/app/branches/${branch.id}/edit`}
                variant="primary"
                icon={<PencilLine className="h-4 w-4" strokeWidth={2} />}
              >
                {t.branches.editBranchBtn}
              </Button>
            )}
            <Button href="/app/branches" variant="secondary">
              {t.branches.allBranches}
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card hoverable animate delay={1}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.branches.details}
          </p>
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
              <dd className="mt-0.5 font-medium">
                {branch.phone ? <PhoneNumber value={branch.phone} /> : "—"}
              </dd>
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

        <WhatsAppCard branchId={branch.id} canManage={canManage} t={t} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card animate delay={2}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            System
          </p>
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
