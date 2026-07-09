import { getNewMembersGrowthReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/date-format";
import Link from "next/link";

type Props = { searchParams: Promise<{ dateFrom?: string; dateTo?: string }> };

export default async function NewMembersGrowthReportPage({ searchParams }: Props) {
  await requireSession();
  const t = await getT();
  const { dateFrom, dateTo } = await searchParams;

  const [report, settings] = await Promise.all([
    getNewMembersGrowthReport(dateFrom, dateTo),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";
  const maxCount = Math.max(1, ...report.rows.map((r) => r.count));

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.reports}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.reports.newMembersGrowth}</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {report.total} new member{report.total !== 1 ? "s" : ""} joined from {report.dateFrom} to{" "}
            {report.dateTo}.
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
          <span className="text-xs font-medium text-foreground/60">{t.reports.dateFromLabel}</span>
          <input
            type="date"
            name="dateFrom"
            defaultValue={report.dateFrom}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-foreground/60">{t.reports.dateToLabel}</span>
          <input
            type="date"
            name="dateTo"
            defaultValue={report.dateTo}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm"
          />
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
                  <th className="pb-3 pr-4">{t.reports.dateCol}</th>
                  <th className="pb-3 pr-4 text-right">{t.reports.countCol}</th>
                  <th className="pb-3 w-1/2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => (
                  <tr key={row.date} className="py-3">
                    <td className="py-3 pr-4 font-mono text-xs text-foreground/60">{formatDate(row.date, dateFormat)}</td>
                    <td className="py-3 pr-4 text-right font-medium">{row.count.toLocaleString()}</td>
                    <td className="py-3">
                      <div className="h-2 rounded-full bg-brand/15">
                        <div
                          className="h-2 rounded-full bg-brand"
                          style={{ width: `${(row.count / maxCount) * 100}%` }}
                        />
                      </div>
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
