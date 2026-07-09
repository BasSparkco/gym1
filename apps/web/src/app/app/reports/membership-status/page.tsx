import { getMembershipStatusBreakdownReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  frozen: "bg-blue-100 text-blue-700",
  expired: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  draft: "bg-yellow-100 text-yellow-700",
};

export default async function MembershipStatusReportPage() {
  await requireSession();
  const t = await getT();

  const report = await getMembershipStatusBreakdownReport();

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.reports}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.reports.membershipStatusBreakdown}</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {report.total} membership{report.total !== 1 ? "s" : ""} as of {report.asOfDate}.
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
          <p className="text-sm text-foreground/40">{t.reports.noResults}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pr-4">{t.reports.statusCol}</th>
                  <th className="pb-3 text-right">{t.reports.countCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => (
                  <tr key={row.status} className="py-3">
                    <td className="py-3 pr-4">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          statusColors[row.status] ?? "bg-gray-100 text-gray-600",
                        ].join(" ")}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">{row.count.toLocaleString()}</td>
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
