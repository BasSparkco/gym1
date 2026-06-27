import { getPaymentsReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/date-format";
import Link from "next/link";

type Props = { searchParams: Promise<{ dateFrom?: string; dateTo?: string }> };

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-orange-100 text-orange-700",
  cancelled: "bg-gray-100 text-gray-500",
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

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.reports}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.reports.payments}</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {report.total} payment{report.total !== 1 ? "s" : ""} from{" "}
            {report.dateFrom} to {report.dateTo}.{" "}
            {t.reports.totalPaid}: <span className="font-semibold text-foreground">${report.totalPaid.toLocaleString()}</span>.
          </p>
        </div>
        <Link
          href="/app/reports"
          className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.reports.allReports}
        </Link>
      </section>

      <section className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
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
                    <tr key={row.paymentId} className="py-3">
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
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            statusColors[row.status] ?? "bg-gray-100 text-gray-600",
                          ].join(" ")}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-foreground/60">{localDate}</td>
                      <td className="py-3 text-right font-medium">
                        ${row.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
