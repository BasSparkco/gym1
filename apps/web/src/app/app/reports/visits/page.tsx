import { getVisitsReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/date-format";
import Link from "next/link";

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
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.reports}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.reports.visits}</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {report.total} visit{report.total !== 1 ? "s" : ""} from{" "}
            {report.dateFrom} to {report.dateTo}.
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
          <p className="text-sm text-foreground/40">{t.reports.noVisits}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pr-4">{t.reports.memberCol}</th>
                  <th className="pb-3 pr-4">{t.reports.methodCol}</th>
                  <th className="pb-3">{t.reports.checkInTimeCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => {
                  const localTime = formatDateTime(row.checkInTime, dateFormat);

                  return (
                    <tr key={row.visitId} className="py-3">
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
                      <td className="py-3 pr-4">
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            row.accessMethod === "qr"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600",
                          ].join(" ")}
                        >
                          {row.accessMethod === "qr" ? t.visits.qrScan : t.visits.manualEntry}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-foreground/60">{localTime}</td>
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
