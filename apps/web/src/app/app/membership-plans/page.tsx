import { listMembershipPlans, getEntitledBranchIds } from "@/lib/membership-plans";
import { listAllMemberships } from "@/lib/memberships";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getActiveCurrencySymbol } from "@/lib/currency";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CreditCard, PlusCircle, PencilLine } from "lucide-react";

function planSummary(plan: Awaited<ReturnType<typeof listMembershipPlans>>[number]) {
  if (plan.planType === "duration") {
    const days = plan.durationDays ?? 0;
    if (days % 30 === 0) return `${days / 30} month${days / 30 !== 1 ? "s" : ""}`;
    return `${days} days`;
  }
  return `${plan.sessionCount ?? 0} sessions`;
}

export default async function MembershipPlansPage() {
  const session = await requireSession();
  const t = await getT();
  const [plans, currencySymbol, memberships, branches] = await Promise.all([
    listMembershipPlans(),
    getActiveCurrencySymbol(session.branch.id),
    listAllMemberships(),
    listBranches(),
  ]);
  const branchNameById = new Map(branches.map((b) => [b.id, b.name]));

  const selectedBranchNamesByPlanId = new Map<string, string[]>();
  await Promise.all(
    plans
      .filter((plan) => !plan.allowAllBranches && !plan.restrictToHomeBranch)
      .map(async (plan) => {
        const entitledIds = await getEntitledBranchIds(plan.id);
        selectedBranchNamesByPlanId.set(
          plan.id,
          entitledIds === "all" ? [] : entitledIds.map((id) => branchNameById.get(id) ?? id),
        );
      }),
  );

  const subscriberCounts = new Map<string, number>();
  for (const ms of memberships) {
    if (ms.status !== "active") continue;
    subscriberCounts.set(ms.planId, (subscriberCounts.get(ms.planId) ?? 0) + 1);
  }
  const mostSubscribedPlanId = plans.length
    ? plans.reduce((best, plan) =>
        (subscriberCounts.get(plan.id) ?? 0) > (subscriberCounts.get(best.id) ?? 0) ? plan : best,
      ).id
    : null;
  const mostSubscribedCount = mostSubscribedPlanId ? (subscriberCounts.get(mostSubscribedPlanId) ?? 0) : 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.membershipPlans}
        title={t.plans.title}
        description={formatDict(t.plans.listDescription, { count: plans.length, plural: plans.length !== 1 ? "s" : "" })}
        actions={
          <Button href="/app/membership-plans/new" variant="primary" icon={<PlusCircle className="h-4 w-4" strokeWidth={2} />}>
            {t.plans.newPlan}
          </Button>
        }
      />

      {plans.length === 0 ? (
        <EmptyState icon={<CreditCard className="h-5 w-5" strokeWidth={2} />} title={t.plans.noPlans} />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan, index) => {
            const count = subscriberCounts.get(plan.id) ?? 0;
            const isMostSubscribed = plan.id === mostSubscribedPlanId && mostSubscribedCount > 0;

            return (
              <Card
                key={plan.id}
                hoverable
                animate
                delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
                className={`relative flex flex-col border-s-4 border-s-brand-deeper ${isMostSubscribed ? "!border-accent-strong" : ""}`}
              >
                {isMostSubscribed && (
                  <Badge
                    tone="success"
                    className="absolute -top-3 start-5 font-semibold"
                  >
                    {t.plans.mostSubscribed}
                  </Badge>
                )}
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">{plan.name}</h2>
                  <Badge tone="outline">
                    {plan.planType === "duration" ? t.plans.durationBased : t.plans.sessionBased}
                  </Badge>
                </div>
                <p className="font-mono mt-3 text-3xl font-bold tracking-tight">
                  {currencySymbol}
                  {plan.price}
                </p>
                <p className="mt-1 text-sm text-foreground/60">{planSummary(plan)}</p>

                <p className="mt-2 text-sm text-foreground/60">
                  <span className="text-foreground/45">{t.plans.branchAccess}: </span>
                  {plan.allowAllBranches ? (
                    <span className="font-medium text-foreground/80">{t.plans.allBranches}</span>
                  ) : plan.restrictToHomeBranch ? (
                    <span className="font-medium text-foreground/80">{t.plans.homeBranchOnly}</span>
                  ) : (selectedBranchNamesByPlanId.get(plan.id) ?? []).length === 0 ? (
                    <span className="font-medium text-red-600">{t.plans.noBranchesSelected}</span>
                  ) : (
                    <span className="font-medium text-foreground/80">
                      {(selectedBranchNamesByPlanId.get(plan.id) ?? []).join(", ")}
                    </span>
                  )}
                </p>

                <div className="mt-4 flex flex-1 flex-wrap gap-2">
                  {plan.freezeAllowed && <Badge tone="brand">{t.plans.freezeAllowed}</Badge>}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <span className="font-mono text-sm text-foreground/60">
                    <span className="font-semibold text-foreground">{count}</span> {t.nav.members}
                  </span>
                  <div className="flex gap-2">
                    <Button href={`/app/membership-plans/${plan.id}`} variant="secondary" size="sm">
                      {t.plans.details}
                    </Button>
                    <Button
                      href={`/app/membership-plans/${plan.id}/edit`}
                      variant="secondary"
                      size="sm"
                      icon={<PencilLine className="h-3.5 w-3.5" strokeWidth={2} />}
                    >
                      {t.actions.edit}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
