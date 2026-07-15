import { listMembershipPlans } from "@/lib/membership-plans";
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
  const [plans, currencySymbol] = await Promise.all([
    listMembershipPlans(),
    getActiveCurrencySymbol(session.branch.id),
  ]);

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

      <section className="grid gap-3">
        {plans.length === 0 && (
          <EmptyState icon={<CreditCard className="h-5 w-5" strokeWidth={2} />} title={t.plans.noPlans} />
        )}
        {plans.map((plan, index) => (
          <Card
            key={plan.id}
            hoverable
            animate
            delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">{plan.name}</h2>
                <Badge tone="outline">{planSummary(plan)}</Badge>
                <Badge tone="outline">
                  {plan.planType === "duration" ? t.plans.durationBased : t.plans.sessionBased}
                </Badge>
                {plan.freezeAllowed && <Badge tone="brand">{t.plans.freezeAllowed}</Badge>}
                {!plan.allowAllBranches && <Badge tone="accent">Branch-restricted</Badge>}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold tabular-nums">
                  {currencySymbol}{plan.price}
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
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
