import { listVisits } from "@/lib/visits";
import { listMembers } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/date-format";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { BadgeTone } from "@/components/ui/badge";
import { History, DoorOpen } from "lucide-react";

type Period = "today" | "week" | "month" | "all";
type Presence = "all" | "inside" | "out";

const PERIODS: Period[] = ["today", "week", "month", "all"];
const PRESENCES: Presence[] = ["all", "inside", "out"];

const accessMethodTone: Record<string, BadgeTone> = {
  qr: "info",
  manual: "neutral",
};

function filterByPeriod(
  visits: Awaited<ReturnType<typeof listVisits>>,
  period: Period,
) {
  if (period === "all") return visits;

  const now = new Date();

  if (period === "today") {
    const todayPrefix = now.toISOString().slice(0, 10);
    return visits.filter((v) => v.checkInTime.startsWith(todayPrefix));
  }

  const cutoff = new Date(now);
  if (period === "week") cutoff.setDate(cutoff.getDate() - 7);
  if (period === "month") cutoff.setDate(cutoff.getDate() - 30);

  const cutoffMs = cutoff.getTime();
  return visits.filter((v) => new Date(v.checkInTime).getTime() >= cutoffMs);
}

function filterByPresence(
  visits: Awaited<ReturnType<typeof listVisits>>,
  presence: Presence,
) {
  if (presence === "inside") return visits.filter((v) => v.checkOutTime === null);
  if (presence === "out") return visits.filter((v) => v.checkOutTime !== null);
  return visits;
}

export default async function VisitsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  await requireSession();
  const t = await getT();

  const rawPeriod = searchParams.period;
  const period: Period =
    typeof rawPeriod === "string" && (PERIODS as string[]).includes(rawPeriod)
      ? (rawPeriod as Period)
      : "week";

  const [visits, members, settings] = await Promise.all([listVisits(), listMembers(), getSettings()]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";
  const checkOutEnabled = settings.checkOutTrackingEnabled;

  const rawPresence = searchParams.presence;
  const presence: Presence =
    checkOutEnabled && typeof rawPresence === "string" && (PRESENCES as string[]).includes(rawPresence)
      ? (rawPresence as Presence)
      : "all";

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const allSorted = visits
    .slice()
    .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime));

  const filtered = filterByPresence(filterByPeriod(allSorted, period), presence);

  const periodLabel: Record<Period, string> = {
    today: t.visits.filterToday,
    week: t.visits.filterWeek,
    month: t.visits.filterMonth,
    all: t.visits.filterAll,
  };

  const presenceLabel: Record<Presence, string> = {
    all: t.visits.filterPresenceAll,
    inside: t.visits.filterInside,
    out: t.visits.filterCheckedOut,
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.visits}
        title={t.visits.title}
        description={
          <>
            {filtered.length} visit{filtered.length !== 1 ? "s" : ""} &middot;{" "}
            {periodLabel[period]}
            {presence !== "all" && <> &middot; {presenceLabel[presence]}</>}
          </>
        }
        actions={
          <Button href="/app/check-in" variant="primary" icon={<DoorOpen className="h-4 w-4" strokeWidth={2} />}>
            {t.nav.checkIn}
          </Button>
        }
      />

      {/* Period filter */}
      <nav className="flex gap-2 flex-wrap">
        {PERIODS.map((p) => {
          const isActive = p === period;
          return isActive ? (
            <span
              key={p}
              className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white shadow-sm"
            >
              {periodLabel[p]}
            </span>
          ) : (
            <Link
              key={p}
              href={`/app/visits?period=${p}&presence=${presence}`}
              className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
            >
              {periodLabel[p]}
            </Link>
          );
        })}
      </nav>

      {/* Presence filter */}
      {checkOutEnabled && (
      <nav className="flex gap-2 flex-wrap">
        {PRESENCES.map((pr) => {
          const isActive = pr === presence;
          return isActive ? (
            <span
              key={pr}
              className={[
                "rounded-full px-4 py-1.5 text-sm font-medium shadow-sm",
                pr === "inside"
                  ? "bg-green-600 text-white"
                  : pr === "out"
                    ? "bg-gray-500 text-white"
                    : "bg-foreground/80 text-white",
              ].join(" ")}
            >
              {pr === "inside" && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-200 align-middle" />}
              {presenceLabel[pr]}
            </span>
          ) : (
            <Link
              key={pr}
              href={`/app/visits?period=${period}&presence=${pr}`}
              className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
            >
              {pr === "inside" && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 align-middle" />}
              {presenceLabel[pr]}
            </Link>
          );
        })}
      </nav>
      )}

      {allSorted.length === 0 ? (
        <EmptyState icon={<History className="h-5 w-5" strokeWidth={2} />} title={t.visits.noVisits} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<History className="h-5 w-5" strokeWidth={2} />} title={t.visits.noVisitsForPeriod} />
      ) : (
        <section className="grid gap-3">
          {filtered.map((visit, index) => {
            const member = memberMap.get(visit.memberId);
            const localTime = formatDateTime(visit.checkInTime, dateFormat);

            return (
              <Card
                key={visit.id}
                as={Link}
                href={`/app/visits/${visit.id}`}
                hoverable
                animate
                delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
                className="flex flex-wrap items-center justify-between gap-3 !px-5 !py-3.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold uppercase">
                    {member ? member.fullName[0] : "?"}
                  </div>
                  <div>
                    <p className="font-medium">
                      {member ? member.fullName : visit.memberId}
                    </p>
                    {member && (
                      <p className="font-mono text-xs text-foreground/50">
                        {member.memberNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-foreground/60">
                  {checkOutEnabled && (
                    <Badge tone={visit.checkOutTime === null ? "success" : "neutral"}>
                      {visit.checkOutTime === null ? t.visits.inside : t.visits.checkedOut}
                    </Badge>
                  )}
                  {visit.accessMethod === "rfid" ? (
                    <Badge tone="neutral" className="!bg-violet-100 !text-violet-700">
                      RFID
                    </Badge>
                  ) : (
                    <Badge tone={accessMethodTone[visit.accessMethod] ?? "neutral"}>
                      {visit.accessMethod === "qr" ? t.visits.qrScan : t.visits.manualEntry}
                    </Badge>
                  )}
                  <span className="text-xs">{localTime}</span>
                </div>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
