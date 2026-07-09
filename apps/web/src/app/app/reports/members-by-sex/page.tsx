import { getMembersBySexReport } from "@/lib/reports";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";

export default async function MembersBySexReportPage() {
  await requireSession();
  const t = await getT();

  const report = await getMembersBySexReport();

  const labelFor = (sex: string) =>
    sex === "male" ? t.reports.maleLabel : sex === "female" ? t.reports.femaleLabel : t.reports.unspecifiedLabel;

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.reports}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.reports.membersBySex}</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {report.total} member{report.total !== 1 ? "s" : ""} as of {report.asOfDate} ({report.activeTotal} active).
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
                  <th className="pb-3 pr-4">{t.reports.sexCol}</th>
                  <th className="pb-3 pr-4 text-right">{t.reports.totalCol}</th>
                  <th className="pb-3 text-right">{t.reports.activeCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => (
                  <tr key={row.sex} className="py-3">
                    <td className="py-3 pr-4 font-medium">{labelFor(row.sex)}</td>
                    <td className="py-3 pr-4 text-right">{row.total.toLocaleString()}</td>
                    <td className="py-3 text-right text-foreground/70">{row.active.toLocaleString()}</td>
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
