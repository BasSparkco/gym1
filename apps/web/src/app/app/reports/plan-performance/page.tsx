import { getPlanPerformanceReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getCurrencySymbol } from "@/lib/currencies";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";

type Props = { searchParams: Promise<{ dateFrom?: string; dateTo?: string }> };

export default async function PlanPerformanceReportPage({ searchParams }: Props) {
  await requireSession();
  const t = await getT();
  const { dateFrom, dateTo } = await searchParams;

  const report = await getPlanPerformanceReport(dateFrom, dateTo);
  const currencySymbol = getCurrencySymbol(report.currency);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.reports.planPerformance}
        description={
          <>
            {report.total} membership{report.total !== 1 ? "s" : ""} sold from {report.dateFrom} to{" "}
            {report.dateTo}. {t.reports.revenueCol}:{" "}
            <span className="font-semibold text-foreground">
              {currencySymbol}
              {report.totalRevenue.toLocaleString()}
            </span>
            .
          </>
        }
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
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pr-4">{t.reports.planCol}</th>
                  <th className="pb-3 pr-4">{t.reports.planTypeCol}</th>
                  <th className="pb-3 pr-4 text-right">{t.reports.countCol}</th>
                  <th className="pb-3 text-right">{t.reports.revenueCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => (
                  <tr key={row.planId} className="py-3 transition-colors hover:bg-black/[0.02]">
                    <td className="py-3 pr-4 font-medium">{row.planName}</td>
                    <td className="py-3 pr-4 text-foreground/70">
                      {row.planType === "duration" ? t.plans.durationBased : t.plans.sessionBased}
                    </td>
                    <td className="py-3 pr-4 text-right">{row.count.toLocaleString()}</td>
                    <td className="py-3 text-right font-medium">
                      {currencySymbol}{row.revenue.toLocaleString()}
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
