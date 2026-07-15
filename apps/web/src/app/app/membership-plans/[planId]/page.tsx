import { getMembershipPlan } from "@/lib/membership-plans";
import {
  getEntitledProgramIds,
  listTrainingPrograms,
} from "@/lib/training-programs";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getActiveCurrencySymbol } from "@/lib/currency";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PencilLine } from "lucide-react";

type Props = { params: Promise<{ planId: string }> };

export default async function MembershipPlanPage({ params }: Props) {
  const { planId } = await params;
  const session = await requireSession();
  const t = await getT();
  const [plan, currencySymbol, entitledIds] = await Promise.all([
    getMembershipPlan(planId),
    getActiveCurrencySymbol(session.branch.id),
    getEntitledProgramIds(planId),
  ]);
  const entitledPrograms =
    entitledIds === "all"
      ? []
      : (await listTrainingPrograms()).filter((p) => entitledIds.includes(p.id));

  const durationLabel = plan.planType === "duration"
    ? (() => {
        const d = plan.durationDays ?? 0;
        if (d % 30 === 0) return `${d / 30} month${d / 30 !== 1 ? "s" : ""} (${d} days)`;
        return `${d} days`;
      })()
    : null;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.membershipPlans}
        title={plan.name}
        description={plan.planType === "duration" ? t.plans.durationBased : t.plans.sessionBased}
        actions={
          <>
            <Button
              href={`/app/membership-plans/${plan.id}/edit`}
              variant="primary"
              icon={<PencilLine className="h-4 w-4" strokeWidth={2} />}
            >
              {t.actions.edit}
            </Button>
            <Button href="/app/membership-plans" variant="secondary">
              {t.plans.allPlans}
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card hoverable animate delay={1}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">{t.plans.planDetails}</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.plans.type}</dt>
              <dd className="mt-0.5 font-medium capitalize">{plan.planType}-based</dd>
            </div>
            {plan.planType === "duration" && (
              <div>
                <dt className="text-foreground/55">{t.plans.duration}</dt>
                <dd className="mt-0.5 font-medium">{durationLabel}</dd>
              </div>
            )}
            {plan.planType === "session" && (
              <div>
                <dt className="text-foreground/55">{t.plans.sessions}</dt>
                <dd className="mt-0.5 font-medium">{plan.sessionCount} sessions</dd>
              </div>
            )}
            <div>
              <dt className="text-foreground/55">{t.plans.defaultPrice}</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{currencySymbol}{plan.price}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.plans.branchAccess}</dt>
              <dd className="mt-0.5 font-medium">{plan.allowAllBranches ? t.plans.allBranches : t.plans.homeBranchOnly}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.plans.programAccess}</dt>
              <dd className="mt-0.5 font-medium">
                {entitledIds === "all" ? (
                  t.plans.allPrograms
                ) : entitledPrograms.length === 0 ? (
                  <span className="text-red-600">{t.plans.noProgramsSelected}</span>
                ) : (
                  entitledPrograms.map((p) => p.name).join(", ")
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <Card hoverable animate delay={2}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t.plans.freezePolicy}</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.plans.freezeAllowed}</dt>
              <dd className="mt-0.5 font-medium">{plan.freezeAllowed ? t.plans.yes : t.plans.no}</dd>
            </div>
            {plan.freezeAllowed && (
              <div>
                <dt className="text-foreground/55">{t.plans.maxFreezeDays}</dt>
                <dd className="mt-0.5 font-medium">
                  {plan.freezeMaxDays ? `${plan.freezeMaxDays} days` : t.plans.unlimited}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </section>

      <Card animate delay={3}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">System</p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-foreground/55">Plan ID</dt>
            <dd className="mt-0.5 font-mono text-xs text-foreground/70">{plan.id}</dd>
          </div>
          <div>
            <dt className="text-foreground/55">Tenant ID</dt>
            <dd className="mt-0.5 font-mono text-xs text-foreground/70">{plan.tenantId}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
