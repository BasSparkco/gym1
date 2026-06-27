import { getActiveMembershipsReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/date-format";
import Link from "next/link";

export default async function ActiveMembershipsReportPage() {
  await requireSession();
  const t = await getT();

  const [{ rows, total, asOfDate }, settings] = await Promise.all([
    getActiveMembershipsReport(),
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
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.reports.activeMemberships}</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {total} active membership{total !== 1 ? "s" : ""} as of {asOfDate}.
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
        {rows.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.reports.noActiveMemberships}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pr-4">{t.reports.memberCol}</th>
                  <th className="pb-3 pr-4">{t.reports.planCol}</th>
                  <th className="pb-3 pr-4">{t.reports.startCol}</th>
                  <th className="pb-3 pr-4">{t.reports.expiresCol}</th>
                  <th className="pb-3 text-right">{t.reports.priceCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.membershipId} className="py-3">
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
                    <td className="py-3 pr-4 text-foreground/70">{row.planName ?? "—"}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-foreground/60">{formatDate(row.startDate, dateFormat)}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-foreground/60">{formatDate(row.endDate, dateFormat)}</td>
                    <td className="py-3 text-right font-medium">
                      ${row.finalPrice.toLocaleString()}
                    </td>
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
