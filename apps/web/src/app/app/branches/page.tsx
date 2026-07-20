import { listBranches } from "@/lib/branches";
import { listMembers } from "@/lib/members";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getSettings, getLogoUrl } from "@/lib/settings";
import { COUNTRIES } from "@/lib/countries";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PhoneNumber } from "@/components/phone-number";
import { Building2, PlusCircle, PencilLine, Users, UserRound } from "lucide-react";

export default async function BranchesPage() {
  const session = await requireSession();
  const t = await getT();
  const [branches, settings, members, employees] = await Promise.all([
    listBranches(),
    getSettings(),
    listMembers(),
    listEmployees(),
  ]);
  const canManage = session.role === "owner" || session.role === "manager";
  const sharedLogoUrl = getLogoUrl(settings.logoUrl);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.branches}
        title={t.branches.title}
        description={formatDict(t.branches.listDescription, { count: branches.length, plural: branches.length !== 1 ? "es" : "", tenant: session.tenant.name })}
        actions={
          canManage && (
            <Button href="/app/branches/new" variant="primary" icon={<PlusCircle className="h-4 w-4" strokeWidth={2} />}>
              {t.branches.newBranch}
            </Button>
          )
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.length === 0 && (
          <EmptyState icon={<Building2 className="h-5 w-5" strokeWidth={2} />} title={t.branches.noBranches} />
        )}
        {branches.map((branch, index) => {
          const memberCount = members.filter((m) => m.homeBranchId === branch.id).length;
          const staffCount = employees.filter((e) => e.branchId === branch.id).length;
          const logoUrl = settings.logoMode === "perBranch" ? getLogoUrl(branch.logoUrl) : sharedLogoUrl;

          return (
            <Card
              key={branch.id}
              hoverable
              animate
              delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
              className="flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-[10px] border border-line bg-white object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white text-foreground/30">
                      <Building2 className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                  )}
                  <h2 className="mt-1.5 text-lg font-semibold tracking-tight">{branch.name}</h2>
                </div>
                <Badge tone={branch.status === "active" ? "success" : "neutral"}>
                  {branch.status === "active" ? t.status.active : t.status.inactive}
                </Badge>
              </div>

              <div className="mt-3 min-h-10">
                {(branch.address || branch.countryCode) && (
                  <p className="text-sm text-foreground/60">
                    {branch.address}
                    {branch.address && branch.countryCode && ", "}
                    {branch.countryCode &&
                      (COUNTRIES.find((c) => c.code === branch.countryCode)?.name ??
                        branch.countryCode)}
                  </p>
                )}
                {branch.phone && (
                  <p className="mt-0.5 text-sm text-foreground/60">
                    <PhoneNumber value={branch.phone} />
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-5 border-t border-line pt-4 text-sm text-foreground/60">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" strokeWidth={2} />
                  <span className="font-mono font-semibold text-foreground">{memberCount}</span>
                  {t.nav.members}
                </div>
                <div className="flex items-center gap-1.5">
                  <UserRound className="h-4 w-4" strokeWidth={2} />
                  <span className="font-mono font-semibold text-foreground">{staffCount}</span>
                  {t.nav.employees}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button href={`/app/branches/${branch.id}`} variant="secondary" size="sm" className="flex-1">
                  {t.actions.view}
                </Button>
                {canManage && (
                  <Button
                    href={`/app/branches/${branch.id}/edit`}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    icon={<PencilLine className="h-3.5 w-3.5" strokeWidth={2} />}
                  >
                    {t.actions.edit}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
