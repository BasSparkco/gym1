import { listVisits } from "@/lib/visits";
import { listMembers } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/date-format";
import Link from "next/link";

type Period = "today" | "week" | "month" | "all";
type Presence = "all" | "inside" | "out";

const PERIODS: Period[] = ["today", "week", "month", "all"];
const PRESENCES: Presence[] = ["all", "inside", "out"];

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

  const rawPresence = searchParams.presence;
  const presence: Presence =
    typeof rawPresence === "string" && (PRESENCES as string[]).includes(rawPresence)
      ? (rawPresence as Presence)
      : "all";

  const [visits, members, settings] = await Promise.all([listVisits(), listMembers(), getSettings()]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

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
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.visits}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {t.visits.title}
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            {filtered.length} visit{filtered.length !== 1 ? "s" : ""} &middot;{" "}
            {periodLabel[period]}
            {presence !== "all" && <> &middot; {presenceLabel[presence]}</>}
          </p>
        </div>
        <Link
          href="/app/check-in"
          className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
        >
          {t.nav.checkIn}
        </Link>
      </section>

      {/* Period filter */}
      <nav className="flex gap-2 flex-wrap">
        {PERIODS.map((p) => {
          const isActive = p === period;
          return isActive ? (
            <span
              key={p}
              className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white"
            >
              {periodLabel[p]}
            </span>
          ) : (
            <Link
              key={p}
              href={`/app/visits?period=${p}&presence=${presence}`}
              className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              {periodLabel[p]}
            </Link>
          );
        })}
      </nav>

      {/* Presence filter */}
      <nav className="flex gap-2 flex-wrap">
        {PRESENCES.map((pr) => {
          const isActive = pr === presence;
          return isActive ? (
            <span
              key={pr}
              className={[
                "rounded-full px-4 py-1.5 text-sm font-medium",
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
              className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              {pr === "inside" && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 align-middle" />}
              {presenceLabel[pr]}
            </Link>
          );
        })}
      </nav>

      <section className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
        {allSorted.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.visits.noVisits}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.visits.noVisitsForPeriod}</p>
        ) : (
          <div className="grid gap-2">
            {filtered.map((visit) => {
              const member = memberMap.get(visit.memberId);
              const localTime = formatDateTime(visit.checkInTime, dateFormat);

              return (
                <Link
                  key={visit.id}
                  href={`/app/visits/${visit.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-3.5 text-sm transition hover:border-brand hover:text-brand"
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
                  <div className="flex items-center gap-4 text-foreground/60">
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        visit.checkOutTime === null
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500",
                      ].join(" ")}
                    >
                      {visit.checkOutTime === null
                        ? t.visits.inside
                        : t.visits.checkedOut}
                    </span>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        visit.accessMethod === "qr"
                          ? "bg-blue-100 text-blue-700"
                          : visit.accessMethod === "rfid"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-gray-100 text-gray-600",
                      ].join(" ")}
                    >
                      {visit.accessMethod === "qr"
                        ? t.visits.qrScan
                        : visit.accessMethod === "rfid"
                          ? "RFID"
                          : t.visits.manualEntry}
                    </span>
                    <span className="text-xs">{localTime}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
