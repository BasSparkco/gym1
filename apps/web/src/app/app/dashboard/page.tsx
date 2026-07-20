import { getDashboardSummary } from "@/lib/dashboard";
import { listVisits } from "@/lib/visits";
import { listMembers } from "@/lib/members";
import { listBranches } from "@/lib/branches";
import { getExpiringSoonReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT, getLang } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";
import { formatDateLong, formatDateTime, formatDate } from "@/lib/date-format";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  DoorOpen,
  UserPlus,
  Users,
  Wallet,
  ArrowRight,
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
  const [t, lang, dashboardSummary, visits, members, settings, expiringSoon, branches] =
    await Promise.all([
      getT(),
      getLang(),
      getDashboardSummary(),
      listVisits(),
      listMembers(),
      getSettings(),
      getExpiringSoonReport(7),
      listBranches(),
    ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";
  const currencySymbol = getCurrencySymbol(expiringSoon.currency);
  const viewingAllBranches = session.role === "owner" && settings.ownerDataScope === "all";

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const latestCheckIns = visits
    .slice()
    .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime))
    .slice(0, 5);

  const soonestExpiring = expiringSoon.rows
    .slice()
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .slice(0, 5);

  const todayStr = new Date().toISOString().slice(0, 10);
  const branchGlance = viewingAllBranches
    ? branches.map((branch) => ({
        branch,
        activeMembers: members.filter(
          (m) => m.homeBranchId === branch.id && m.status === "active",
        ).length,
        todayCheckIns: visits.filter(
          (v) => v.branchId === branch.id && v.checkInTime.startsWith(todayStr),
        ).length,
      }))
    : [];

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
      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(var(--shadow-tint),0.08)]">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {session.branch.name}
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
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

      {/* Latest check-ins + Memberships expiring soon */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card animate delay={2} className="!px-0 !py-0">
          <div className="flex items-center justify-between gap-3 px-6 pt-6">
            <h2 className="text-lg font-semibold tracking-tight">{t.dashboard.latestCheckIns}</h2>
            <Link
              href="/app/visits"
              className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              {t.visits.allVisits}
              <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
          <div className="mt-4 grid">
            {latestCheckIns.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-foreground/60">{t.dashboard.noRecentCheckIns}</p>
            ) : (
              latestCheckIns.map((visit) => {
                const member = memberMap.get(visit.memberId);
                return (
                  <Link
                    key={visit.id}
                    href={`/app/visits/${visit.id}`}
                    className="flex items-center justify-between gap-3 border-t border-line px-6 py-3 text-sm transition-colors hover:bg-surface-muted/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold uppercase text-brand">
                        {member ? member.fullName[0] : "?"}
                      </div>
                      <div>
                        <p className="font-medium">{member ? member.fullName : visit.memberId}</p>
                        {member && (
                          <p className="font-mono text-xs text-foreground/50">{member.memberNumber}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/60">
                      <Badge tone={visit.checkOutTime === null ? "success" : "neutral"}>
                        {visit.checkOutTime === null ? t.visits.inside : t.visits.checkedOut}
                      </Badge>
                      <span className="font-mono text-xs">{formatDateTime(visit.checkInTime, dateFormat)}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          <div className="h-6" />
        </Card>

        <Card animate delay={3} className="!px-0 !py-0">
          <div className="flex items-center justify-between gap-3 px-6 pt-6">
            <h2 className="text-lg font-semibold tracking-tight">{t.dashboard.expiringMemberships}</h2>
            <Link
              href="/app/reports/expiring-soon"
              className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              {t.reports.expiringSoon}
              <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
          <div className="mt-4 grid">
            {soonestExpiring.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-foreground/60">{t.dashboard.noExpiringMemberships}</p>
            ) : (
              soonestExpiring.map((row) => (
                <Link
                  key={row.membershipId}
                  href={`/app/members/${row.memberId}`}
                  className="flex items-center justify-between gap-3 border-t border-line px-6 py-3 text-sm transition-colors hover:bg-surface-muted/60"
                >
                  <div>
                    <p className="font-medium">{row.memberName ?? row.memberId}</p>
                    <p className="text-xs text-foreground/50">
                      {row.planName} &middot; {currencySymbol}
                      {row.finalPrice}
                    </p>
                  </div>
                  <Badge tone="warning">{formatDate(row.endDate, dateFormat)}</Badge>
                </Link>
              ))
            )}
          </div>
          <div className="h-6" />
        </Card>
      </section>

      {/* Branches at a glance (owners viewing all branches) */}
      {viewingAllBranches && branchGlance.length > 0 && (
        <section>
          <Card animate delay={4}>
            <h2 className="text-lg font-semibold tracking-tight">{t.dashboard.branchesAtGlance}</h2>
            <p className="mt-1 text-sm text-foreground/60">{t.dashboard.branchesAtGlanceHelper}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {branchGlance.map(({ branch, activeMembers, todayCheckIns }) => (
                <div
                  key={branch.id}
                  className="rounded-[10px] border border-line bg-white px-4 py-3.5"
                >
                  <p className="font-medium">{branch.name}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-foreground/60">
                    <span>
                      <span className="font-mono font-semibold text-foreground">{activeMembers}</span>{" "}
                      {t.dashboard.cardActiveMemberships}
                    </span>
                    <span>
                      <span className="font-mono font-semibold text-foreground">{todayCheckIns}</span>{" "}
                      {t.dashboard.cardTodayCheckIns}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

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
