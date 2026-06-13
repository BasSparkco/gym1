import { listMembershipPlans } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";

function planSummary(plan: Awaited<ReturnType<typeof listMembershipPlans>>[number]) {
  if (plan.planType === "duration") {
    const days = plan.durationDays ?? 0;
    if (days % 30 === 0) return `${days / 30} month${days / 30 !== 1 ? "s" : ""}`;
    return `${days} days`;
  }
  return `${plan.sessionCount ?? 0} sessions`;
}

export default async function MembershipPlansPage() {
  await requireSession();
  const t = await getT();
  const plans = await listMembershipPlans();

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.membershipPlans}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.plans.title}</h1>
          <p className="mt-2 text-sm leading-7 text-foreground/70">
            {plans.length} plan{plans.length !== 1 ? "s" : ""} configured for this tenant.
          </p>
        </div>
        <Link
          href="/app/membership-plans/new"
          className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
        >
          {t.plans.newPlan}
        </Link>
      </section>

      <section className="grid gap-3">
        {plans.length === 0 && (
          <div className="rounded-[2rem] border border-line bg-surface px-6 py-10 text-center text-sm text-foreground/60">
            {t.plans.noPlans}
          </div>
        )}
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="rounded-[1.75rem] border border-line bg-surface px-6 py-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">{plan.name}</h2>
                <span className="rounded-full border border-line bg-white px-2.5 py-0.5 text-xs font-medium text-foreground/60">
                  {planSummary(plan)}
                </span>
                <span className="rounded-full border border-line bg-white px-2.5 py-0.5 text-xs font-medium text-foreground/60">
                  {plan.planType === "duration" ? t.plans.durationBased : t.plans.sessionBased}
                </span>
                {plan.freezeAllowed && (
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                    {t.plans.freezeAllowed}
                  </span>
                )}
                {!plan.allowAllBranches && (
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                    Branch-restricted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold tabular-nums">
                  ${plan.price}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/app/membership-plans/${plan.id}`}
                    className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
                  >
                    {t.plans.details}
                  </Link>
                  <Link
                    href={`/app/membership-plans/${plan.id}/edit`}
                    className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
                  >
                    {t.actions.edit}
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
