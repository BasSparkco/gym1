import Link from "next/link";
import { getDashboardSummary } from "@/lib/dashboard";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";

type CardId =
  | "active-memberships"
  | "expiring-memberships"
  | "today-check-ins"
  | "payments-logged";

export default async function DashboardPage() {
  const session = await requireSession();
  const t = await getT();
  const dashboardSummary = await getDashboardSummary();

  const cardLabel: Record<CardId, string> = {
    "active-memberships": t.dashboard.cardActiveMemberships,
    "expiring-memberships": t.dashboard.cardExpiringWeek,
    "today-check-ins": t.dashboard.cardTodayCheckIns,
    "payments-logged": t.dashboard.cardPaymentsLogged,
  };

  const cardHelper: Record<CardId, string> = {
    "active-memberships": t.dashboard.cardActiveMembershipsHelper,
    "expiring-memberships": t.dashboard.cardExpiringWeekHelper,
    "today-check-ins": t.dashboard.cardTodayCheckInsHelper,
    "payments-logged": t.dashboard.cardPaymentsLoggedHelper,
  };

  const actionLabel: Record<string, string> = {
    "Create member": t.dashboard.actionCreateMember,
    "Sell membership": t.dashboard.actionSellMembership,
    "Record payment": t.dashboard.actionRecordPayment,
    "Check in member": t.dashboard.actionCheckInMember,
  };

  const quickActionRoutes: Record<string, string> = {
    "Create member": "/app/members/new",
    "Sell membership": "/app/members",
    "Record payment": "/app/members",
    "Check in member": "/app/check-in",
  };

  const reportingDate = new Date(
    `${dashboardSummary.scope.asOfDate}T00:00:00.000Z`,
  ).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="grid gap-6">
      {/* Hero */}
      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {session.branch.name}
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t.dashboard.title}
            </h1>
            <p className="mt-2 text-sm leading-7 text-foreground/70">
              {session.name} &middot; {session.tenant.name}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {dashboardSummary.quickActions.map((action) => {
              const href = quickActionRoutes[action];
              const label = actionLabel[action] ?? action;
              if (href) {
                return (
                  <Link
                    key={action}
                    href={href}
                    className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
                  >
                    {label}
                  </Link>
                );
              }
              return (
                <button
                  key={action}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardSummary.cards.map((card) => {
          const id = card.id as CardId;
          return (
            <article
              key={card.id}
              className={`rounded-[1.75rem] border border-line ${card.tone} px-5 py-5`}
            >
              <p className="text-sm text-foreground/60">{cardLabel[id] ?? card.label}</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{card.value}</p>
              <p className="mt-3 text-sm leading-6 text-foreground/65">{cardHelper[id] ?? card.helperText}</p>
            </article>
          );
        })}
      </section>

      {/* Branch overview + Operations guide */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-line bg-surface px-6 py-6">
          <h2 className="text-xl font-semibold tracking-tight">{t.dashboard.overviewTitle}</h2>
          <div className="mt-5 grid gap-4">
            <div className="rounded-3xl border border-line bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
                {t.dashboard.overviewTenantLabel}
              </p>
              <p className="mt-2 text-lg font-semibold">{session.tenant.name}</p>
              <p className="mt-1 text-sm text-foreground/70">
                {session.branch.name} &middot; {t.dashboard.overviewRoleLabel}: {session.role}
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                {t.dashboard.overviewAsOfLabel}
              </p>
              <p className="mt-2 text-lg font-semibold">{reportingDate}</p>
              <p className="mt-1 text-sm text-foreground/70">
                {t.dashboard.overviewDataHelper}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-line bg-brand-strong px-6 py-6 text-white">
          <h2 className="text-xl font-semibold tracking-tight">{t.dashboard.operationsGuideTitle}</h2>
          <ul className="mt-5 grid gap-4 text-sm leading-7 text-white/75">
            <li>{t.dashboard.guide1}</li>
            <li>{t.dashboard.guide2}</li>
            <li>{t.dashboard.guide3}</li>
            <li>{t.dashboard.guide4}</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
