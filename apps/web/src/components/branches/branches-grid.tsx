"use client";

import { Fragment, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PhoneNumber } from "@/components/phone-number";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/components/ui/cn";
import { BranchDetailView } from "@/components/branches/branch-detail-view";
import { BranchEditForm } from "@/components/branches/branch-edit-form";
import { updateBranchAction } from "@/app/app/branches/actions";
import type { Branch } from "@/lib/branches";
import type { TenantSettings } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";
import { Building2, PencilLine, Users, UserRound } from "lucide-react";

export type BranchCardData = {
  branch: Branch;
  memberCount: number;
  staffCount: number;
  logoUrl: string | null;
};

type Props = {
  branches: BranchCardData[];
  settings: TenantSettings;
  canManage: boolean;
  t: Dict;
};

export function BranchesGrid({ branches, settings, canManage, t }: Props) {
  const [expanded, setExpanded] = useState<{ id: string; mode: "view" | "edit" } | null>(null);

  function toggleView(id: string) {
    setExpanded((prev) => (prev && prev.id === id && prev.mode === "view" ? null : { id, mode: "view" }));
  }

  function toggleEdit(id: string) {
    setExpanded((prev) => (prev && prev.id === id && prev.mode === "edit" ? null : { id, mode: "edit" }));
  }

  if (branches.length === 0) {
    return <EmptyState icon={<Building2 className="h-5 w-5" strokeWidth={2} />} title={t.branches.noBranches} />;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {branches.map(({ branch, memberCount, staffCount, logoUrl }, index) => {
        const isView = expanded?.id === branch.id && expanded.mode === "view";
        const isEdit = expanded?.id === branch.id && expanded.mode === "edit";
        const isActive = isView || isEdit;

        return (
          <Fragment key={branch.id}>
            <Card
              hoverable
              animate
              delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
              className={cn(
                "flex flex-col border-s-4 border-s-brand transition-shadow",
                isActive && "ring-2 ring-brand ring-offset-2 ring-offset-background",
              )}
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
                      (COUNTRIES.find((c) => c.code === branch.countryCode)?.name ?? branch.countryCode)}
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
                <Button
                  type="button"
                  variant={isView ? "primary" : "secondary"}
                  size="sm"
                  className="flex-1"
                  aria-pressed={isView}
                  onClick={() => toggleView(branch.id)}
                >
                  {t.actions.view}
                </Button>
                {canManage && (
                  <Button
                    type="button"
                    variant={isEdit ? "primary" : "secondary"}
                    size="sm"
                    className="flex-1"
                    aria-pressed={isEdit}
                    icon={<PencilLine className="h-3.5 w-3.5" strokeWidth={2} />}
                    onClick={() => toggleEdit(branch.id)}
                  >
                    {t.actions.edit}
                  </Button>
                )}
              </div>
            </Card>

            {isActive && (
              <div className="animate-fade-in-up rounded-[18px] border border-line bg-surface-muted/40 px-5 py-6 sm:px-7 md:col-span-2 xl:col-span-3">
                {isView ? (
                  <BranchDetailView branch={branch} canManage={canManage} t={t} />
                ) : (
                  <BranchEditForm
                    branch={branch}
                    settings={settings}
                    t={t}
                    action={updateBranchAction}
                    onCancel={() => setExpanded(null)}
                  />
                )}
              </div>
            )}
          </Fragment>
        );
      })}
    </section>
  );
}
