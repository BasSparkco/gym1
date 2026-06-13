import { getMembershipPlan } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";

type Props = { params: Promise<{ planId: string }> };

export default async function MembershipPlanPage({ params }: Props) {
  const { planId } = await params;
  await requireSession();
  const t = await getT();
  const plan = await getMembershipPlan(planId);

  const durationLabel = plan.planType === "duration"
    ? (() => {
        const d = plan.durationDays ?? 0;
        if (d % 30 === 0) return `${d / 30} month${d / 30 !== 1 ? "s" : ""} (${d} days)`;
        return `${d} days`;
      })()
    : null;

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.membershipPlans}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{plan.name}</h1>
          <p className="mt-2 text-sm leading-7 text-foreground/70">
            {plan.planType === "duration" ? t.plans.durationBased : t.plans.sessionBased}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/app/membership-plans/${plan.id}/edit`}
            className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            {t.actions.edit}
          </Link>
          <Link
            href="/app/membership-plans"
            className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            {t.plans.allPlans}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
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
              <dd className="mt-0.5 font-medium tabular-nums">${plan.price}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.plans.branchAccess}</dt>
              <dd className="mt-0.5 font-medium">{plan.allowAllBranches ? t.plans.allBranches : t.plans.homeBranchOnly}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
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
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
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
      </section>
    </div>
  );
}
