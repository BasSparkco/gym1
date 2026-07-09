import { getUpcomingBirthdaysReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/date-format";
import Link from "next/link";

type Props = { searchParams: Promise<{ days?: string }> };

export default async function UpcomingBirthdaysReportPage({ searchParams }: Props) {
  await requireSession();
  const t = await getT();
  const { days } = await searchParams;
  const selectedDays = days ? Number(days) : 30;

  const [report, settings] = await Promise.all([
    getUpcomingBirthdaysReport(selectedDays),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.reports}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.reports.upcomingBirthdays}</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {report.total} member{report.total !== 1 ? "s" : ""} with a birthday in the next {report.days} days.
          </p>
        </div>
        <Link
          href="/app/reports"
          className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.reports.allReports}
        </Link>
      </section>

      <form className="flex flex-wrap items-end gap-3 rounded-[1.75rem] border border-line bg-surface px-6 py-5">
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-foreground/60">{t.reports.daysLabel}</span>
          <select
            name="days"
            defaultValue={String(selectedDays)}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm"
          >
            <option value="7">7</option>
            <option value="30">30</option>
            <option value="60">60</option>
            <option value="90">90</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          {t.reports.applyFilter}
        </button>
      </form>

      <section className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
        {report.rows.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.reports.noResults}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pr-4">{t.reports.memberCol}</th>
                  <th className="pb-3 pr-4">{t.reports.birthdayCol}</th>
                  <th className="pb-3 pr-4">{t.reports.phoneCol}</th>
                  <th className="pb-3 text-right">{t.reports.daysUntilCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => (
                  <tr key={row.memberId} className="py-3">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/app/members/${row.memberId}`}
                        className="font-medium hover:text-brand hover:underline"
                      >
                        {row.memberName}
                      </Link>
                      <p className="font-mono text-xs text-foreground/50">{row.memberNumber}</p>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-foreground/60">{formatDate(row.dateOfBirth, dateFormat)}</td>
                    <td className="py-3 pr-4 text-foreground/70">{row.phone ?? "—"}</td>
                    <td className="py-3 text-right font-medium">
                      {row.daysUntil === 0 ? "Today" : row.daysUntil}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
