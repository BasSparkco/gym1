import { getMembershipStatusBreakdownReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

const statusTone: Record<string, BadgeTone> = {
  active: "success",
  frozen: "info",
  expired: "neutral",
  cancelled: "danger",
  draft: "warning",
};

export default async function MembershipStatusReportPage() {
  await requireSession();
  const t = await getT();

  const report = await getMembershipStatusBreakdownReport();

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.reports.membershipStatusBreakdown}
        description={formatDict(t.reports.membershipStatusDescription, { total: report.total, plural: report.total !== 1 ? "s" : "", asOfDate: report.asOfDate })}
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
                <tr className="border-b border-line text-start text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pe-4">{t.reports.statusCol}</th>
                  <th className="pb-3 text-end">{t.reports.countCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => (
                  <tr key={row.status} className="py-3 transition-colors hover:bg-black/[0.02]">
                    <td className="py-3 pe-4">
                      <Badge tone={statusTone[row.status] ?? "neutral"} className="capitalize">
                        {row.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-end font-medium">{row.count.toLocaleString()}</td>
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
