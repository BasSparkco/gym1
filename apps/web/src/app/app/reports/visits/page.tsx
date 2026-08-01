import { getVisitsReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/date-format";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

type Props = { searchParams: Promise<{ dateFrom?: string; dateTo?: string }> };

export default async function VisitsReportPage({ searchParams }: Props) {
  await requireSession();
  const t = await getT();
  const { dateFrom, dateTo } = await searchParams;

  const [report, settings] = await Promise.all([
    getVisitsReport(dateFrom, dateTo),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.reports.visits}
        description={formatDict(t.reports.visitsDescription, { total: report.total, plural: report.total !== 1 ? "s" : "", dateFrom: report.dateFrom, dateTo: report.dateTo })}
        actions={
          <Button href="/app/reports" variant="secondary" icon={<ArrowLeft className="h-4 w-4" strokeWidth={2} />}>
            {t.reports.allReports}
          </Button>
        }
      />

      <Card animate delay={1}>
        {report.rows.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.reports.noVisits}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-start text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pe-4">{t.reports.memberCol}</th>
                  <th className="pb-3 pe-4">{t.reports.methodCol}</th>
                  <th className="pb-3">{t.reports.checkInTimeCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => {
                  const localTime = formatDateTime(row.checkInTime, dateFormat);

                  return (
                    <tr key={row.visitId} className="py-3 transition-colors hover:bg-black/[0.02]">
                      <td className="py-3 pe-4">
                        <Link
                          href={`/app/members/${row.memberId}`}
                          className="font-medium hover:text-brand hover:underline"
                        >
                          {row.memberName ?? row.memberId}
                        </Link>
                        {row.memberNumber && (
                          <p className="font-mono text-xs text-foreground/50">{row.memberNumber}</p>
                        )}
                      </td>
                      <td className="py-3 pe-4">
                        <Badge tone={row.accessMethod === "qr" ? "info" : "neutral"}>
                          {row.accessMethod === "qr" ? t.visits.qrScan : t.visits.manualEntry}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-foreground/60">{localTime}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
