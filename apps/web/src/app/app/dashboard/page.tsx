import { getDashboardSummary } from "@/lib/dashboard";
import { requireSession } from "@/lib/session";
import { getT, getLang } from "@/lib/i18n";
import { formatDateLong } from "@/lib/date-format";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  DoorOpen,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CardId =
  | "active-memberships"
  | "expiring-memberships"
  | "today-check-ins"
  | "payments-logged";

const cardIcon: Record<CardId, LucideIcon> = {
  "active-memberships": Users,
  "expiring-memberships": CalendarClock,
  "today-check-ins": DoorOpen,
  "payments-logged": Wallet,
};

const actionIcon: Record<string, LucideIcon> = {
  "Create member": UserPlus,
  "Sell membership": Wallet,
  "Record payment": Wallet,
  "Check in member": DoorOpen,
};

export default async function DashboardPage() {
  const session = await requireSession();
  const [t, lang, dashboardSummary] = await Promise.all([getT(), getLang(), getDashboardSummary()]);

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

  const reportingDate = formatDateLong(dashboardSummary.scope.asOfDate, lang);

  return (
    <div className="grid gap-6">
      {/* Hero */}
      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
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
              const Icon = actionIcon[action];
              return (
                <Button key={action} href={href} variant="secondary" icon={Icon && <Icon className="h-4 w-4" strokeWidth={2} />}>
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardSummary.cards.map((card, index) => {
          const id = card.id as CardId;
          const Icon = cardIcon[id];
          return (
            <StatCard
              key={card.id}
              icon={Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
              label={cardLabel[id] ?? card.label}
              value={card.value}
              helper={cardHelper[id] ?? card.helperText}
              tone={card.tone}
              delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
            />
          );
        })}
      </section>

      {/* Branch overview + Operations guide */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="animate-fade-in-up stagger-3 rounded-[2rem] border border-line bg-surface px-6 py-6">
          <h2 className="text-xl font-semibold tracking-tight">{t.dashboard.overviewTitle}</h2>
          <div className="mt-5 grid gap-4">
            <div className="rounded-3xl border border-line bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
                {t.dashboard.overviewTenantLabel}
              </p>
              <p className="mt-2 text-lg font-semibold">{session.tenant.name}</p>
              <p className="mt-1 text-sm text-foreground/70">{session.branch.name}</p>
              <p className="mt-0.5 text-sm text-foreground/70">
                {t.dashboard.overviewRoleLabel}:{" "}
                <span className="font-semibold text-foreground">{session.role}</span>
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
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

        <article className="animate-fade-in-up stagger-4 relative overflow-hidden rounded-[2rem] border border-line bg-brand-strong px-6 py-6 text-white">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <h2 className="relative text-xl font-semibold tracking-tight">{t.dashboard.operationsGuideTitle}</h2>
          <ul className="relative mt-5 grid gap-4 text-sm leading-7 text-white/75">
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
