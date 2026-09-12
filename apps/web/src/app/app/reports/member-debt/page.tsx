import { getMemberDebtReport } from "@/lib/reports";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";

type SearchParams = { branch?: string };

export default async function MemberDebtReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const t = await getT();
  const { branch: branchFilter } = await searchParams;

  const [report, branches, settings] = await Promise.all([
    getMemberDebtReport(branchFilter),
    listBranches(),
    getSettings(),
  ]);
  const currencySymbol = getCurrencySymbol(report.currency);
  const viewingAllBranches = session.role === "owner" && settings.ownerDataScope === "all";

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.reports.memberDebt}
        description={formatDict(t.reports.memberDebtDescription, {
          total: report.total,
          plural: report.total !== 1 ? "s" : "",
          currencySymbol,
          totalDebt: report.totalDebt.toLocaleString(),
        })}
        actions={
          <Button href="/app/reports" variant="secondary" icon={<ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />}>
            {t.reports.allReports}
          </Button>
        }
      />

      {viewingAllBranches && (
        <form className="flex flex-wrap items-end gap-3 rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-foreground/60">{t.members.homeBranch}</span>
            <select
              name="branch"
              defaultValue={branchFilter ?? ""}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm"
            >
              <option value="">{t.employees.filterAllBranches}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="primary" size="md" icon={<Filter className="h-4 w-4" strokeWidth={2} />}>
            {t.reports.applyFilter}
          </Button>
        </form>
      )}

      <Card animate delay={1}>
        {report.rows.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.reports.noMemberDebt}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-start text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pe-4">{t.reports.memberCol}</th>
                  <th className="pb-3 pe-4">{t.reports.phoneCol}</th>
                  {viewingAllBranches && <th className="pb-3 pe-4">{t.members.homeBranch}</th>}
                  <th className="pb-3 text-end">{t.reports.debtCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => (
                  <tr key={row.memberId} className="py-3 transition-colors hover:bg-black/[0.02]">
                    <td className="py-3 pe-4">
                      <Link
                        href={`/app/members/${row.memberId}`}
                        className="font-medium hover:text-brand hover:underline"
                      >
                        {row.memberName}
                      </Link>
                      <p className="font-mono text-xs text-foreground/50">{row.memberNumber}</p>
                    </td>
                    <td className="py-3 pe-4 font-mono text-xs text-foreground/60">{row.phone ?? "—"}</td>
                    {viewingAllBranches && (
                      <td className="py-3 pe-4 text-foreground/70">{row.branchName ?? "—"}</td>
                    )}
                    <td className="py-3 text-end font-semibold text-danger">
                      {currencySymbol}
                      {row.debt.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line font-semibold">
                  <td className="pt-3 pe-4" colSpan={viewingAllBranches ? 3 : 2}>
                    {t.reports.totalDebtLabel}
                  </td>
                  <td className="pt-3 text-end text-danger">
                    {currencySymbol}
                    {report.totalDebt.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
