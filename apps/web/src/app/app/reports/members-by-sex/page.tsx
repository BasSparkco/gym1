import { getMembersBySexReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function MembersBySexReportPage() {
  await requireSession();
  const t = await getT();

  const report = await getMembersBySexReport();

  const labelFor = (sex: string) =>
    sex === "male" ? t.reports.maleLabel : sex === "female" ? t.reports.femaleLabel : t.reports.unspecifiedLabel;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.reports.membersBySex}
        description={formatDict(t.reports.membersBySexDescription, { total: report.total, plural: report.total !== 1 ? "s" : "", asOfDate: report.asOfDate, activeTotal: report.activeTotal })}
        actions={
          <Button href="/app/reports" variant="secondary" icon={<ArrowLeft className="h-4 w-4" strokeWidth={2} />}>
            {t.reports.allReports}
          </Button>
        }
      />

      <Card animate delay={1}>
        {report.rows.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.reports.noResults}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pr-4">{t.reports.sexCol}</th>
                  <th className="pb-3 pr-4 text-right">{t.reports.totalCol}</th>
                  <th className="pb-3 text-right">{t.reports.activeCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => (
                  <tr key={row.sex} className="py-3 transition-colors hover:bg-black/[0.02]">
                    <td className="py-3 pr-4 font-medium">{labelFor(row.sex)}</td>
                    <td className="py-3 pr-4 text-right">{row.total.toLocaleString()}</td>
                    <td className="py-3 text-right text-foreground/70">{row.active.toLocaleString()}</td>
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
