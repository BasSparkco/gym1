import { getExpiredMembershipsReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";
import { formatDate } from "@/lib/date-format";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default async function ExpiredMembershipsReportPage() {
  await requireSession();
  const t = await getT();

  const [{ rows, total, asOfDate, currency }, settings] = await Promise.all([
    getExpiredMembershipsReport(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.reports.expiredMemberships}
        description={formatDict(t.reports.expiredMembershipsDescription, { total, plural: total !== 1 ? "s" : "", asOfDate })}
        actions={
          <Button href="/app/reports" variant="secondary" icon={<ArrowLeft className="h-4 w-4" strokeWidth={2} />}>
            {t.reports.allReports}
          </Button>
        }
      />

      <Card animate delay={1}>
        {rows.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.reports.noExpiredMemberships}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-start text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pe-4">{t.reports.memberCol}</th>
                  <th className="pb-3 pe-4">{t.reports.planCol}</th>
                  <th className="pb-3 pe-4">{t.reports.startCol}</th>
                  <th className="pb-3 pe-4">{t.reports.expiredCol}</th>
                  <th className="pb-3 pe-4">{t.reports.statusCol}</th>
                  <th className="pb-3 text-end">{t.reports.priceCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.membershipId} className="py-3 transition-colors hover:bg-black/[0.02]">
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
                    <td className="py-3 pe-4 text-foreground/70">{row.planName ?? "—"}</td>
                    <td className="py-3 pe-4 font-mono text-xs text-foreground/60">{formatDate(row.startDate, dateFormat)}</td>
                    <td className="py-3 pe-4 font-mono text-xs text-foreground/60">{formatDate(row.endDate, dateFormat)}</td>
                    <td className="py-3 pe-4">
                      <Badge tone="neutral">{row.status}</Badge>
                    </td>
                    <td className="py-3 text-end font-medium">
                      {currencySymbol}{row.finalPrice.toLocaleString()}
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
