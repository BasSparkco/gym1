import { getNewMembersGrowthReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/date-format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";

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
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.reports.newMembersGrowth}
        description={formatDict(t.reports.newMembersGrowthDescription, { total: report.total, plural: report.total !== 1 ? "s" : "", dateFrom: report.dateFrom, dateTo: report.dateTo })}
        actions={
          <Button href="/app/reports" variant="secondary" icon={<ArrowLeft className="h-4 w-4" strokeWidth={2} />}>
            {t.reports.allReports}
          </Button>
        }
      />

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
        <Button type="submit" variant="primary" size="md" icon={<Filter className="h-4 w-4" strokeWidth={2} />}>
          {t.reports.applyFilter}
        </Button>
      </form>

      <Card animate delay={1}>
        {report.rows.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.reports.noResults}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-start text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pe-4">{t.reports.dateCol}</th>
                  <th className="pb-3 pe-4 text-end">{t.reports.countCol}</th>
                  <th className="pb-3 w-1/2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => (
                  <tr key={row.date} className="py-3 transition-colors hover:bg-black/[0.02]">
                    <td className="py-3 pe-4 font-mono text-xs text-foreground/60">{formatDate(row.date, dateFormat)}</td>
                    <td className="py-3 pe-4 text-end font-medium">{row.count.toLocaleString()}</td>
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
      </Card>
    </div>
  );
}
