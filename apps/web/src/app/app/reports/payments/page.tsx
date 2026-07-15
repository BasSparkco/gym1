import { getPaymentsReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";
import { formatDateTime } from "@/lib/date-format";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

type Props = { searchParams: Promise<{ dateFrom?: string; dateTo?: string }> };

const statusTone: Record<string, BadgeTone> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "warning",
  cancelled: "neutral",
};

export default async function PaymentsReportPage({ searchParams }: Props) {
  await requireSession();
  const t = await getT();
  const { dateFrom, dateTo } = await searchParams;

  const [report, settings] = await Promise.all([
    getPaymentsReport(dateFrom, dateTo),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";
  const currencySymbol = getCurrencySymbol(report.currency);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.reports.payments}
        description={
          <>
            {report.total} payment{report.total !== 1 ? "s" : ""} from{" "}
            {report.dateFrom} to {report.dateTo}.{" "}
            {t.reports.totalPaid}: <span className="font-semibold text-foreground">{currencySymbol}{report.totalPaid.toLocaleString()}</span>.
          </>
        }
        actions={
          <Button href="/app/reports" variant="secondary" icon={<ArrowLeft className="h-4 w-4" strokeWidth={2} />}>
            {t.reports.allReports}
          </Button>
        }
      />

      <Card animate delay={1}>
        {report.rows.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.reports.noPayments}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pr-4">{t.reports.memberCol}</th>
                  <th className="pb-3 pr-4">{t.reports.methodCol}</th>
                  <th className="pb-3 pr-4">{t.reports.statusCol}</th>
                  <th className="pb-3 pr-4">{t.reports.dateCol}</th>
                  <th className="pb-3 text-right">{t.reports.amountCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => {
                  const localDate = formatDateTime(row.paymentDate, dateFormat);

                  return (
                    <tr key={row.paymentId} className="py-3 transition-colors hover:bg-black/[0.02]">
                      <td className="py-3 pr-4">
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
                      <td className="py-3 pr-4 text-foreground/60 capitalize">{row.paymentMethod}</td>
                      <td className="py-3 pr-4">
                        <Badge tone={statusTone[row.status] ?? "neutral"}>{row.status}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs text-foreground/60">{localDate}</td>
                      <td className="py-3 text-right font-medium">
                        {currencySymbol}{row.amount.toLocaleString()}
                      </td>
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
