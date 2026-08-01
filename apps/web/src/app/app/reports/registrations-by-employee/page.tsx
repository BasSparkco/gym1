import { getRegistrationsByEmployeeReport } from "@/lib/reports";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/date-format";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";

type Props = {
  searchParams: Promise<{ employeeId?: string; dateFrom?: string; dateTo?: string }>;
};

export default async function RegistrationsByEmployeeReportPage({ searchParams }: Props) {
  await requireSession();
  const t = await getT();
  const { employeeId, dateFrom, dateTo } = await searchParams;

  const [report, employees, settings] = await Promise.all([
    getRegistrationsByEmployeeReport(employeeId, dateFrom, dateTo),
    listEmployees(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.reports.registrationsByEmployee}
        description={
          <>
            {report.total} member{report.total !== 1 ? "s" : ""} registered
            {report.dateFrom || report.dateTo
              ? ` from ${report.dateFrom ?? "…"} to ${report.dateTo ?? "…"}`
              : ""}
            .
          </>
        }
        actions={
          <Button href="/app/reports" variant="secondary" icon={<ArrowLeft className="h-4 w-4" strokeWidth={2} />}>
            {t.reports.allReports}
          </Button>
        }
      />

      <form className="flex flex-wrap items-end gap-3 rounded-[1.75rem] border border-line bg-surface px-6 py-5">
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-foreground/60">{t.reports.employeeCol}</span>
          <select
            name="employeeId"
            defaultValue={employeeId ?? ""}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm"
          >
            <option value="">{t.reports.allEmployeesLabel}</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-foreground/60">{t.reports.dateFromLabel}</span>
          <input
            type="date"
            name="dateFrom"
            defaultValue={dateFrom ?? ""}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-foreground/60">{t.reports.dateToLabel}</span>
          <input
            type="date"
            name="dateTo"
            defaultValue={dateTo ?? ""}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm"
          />
        </label>
        <Button type="submit" variant="primary" size="md" icon={<Filter className="h-4 w-4" strokeWidth={2} />}>
          {t.reports.applyFilter}
        </Button>
      </form>

      <Card animate delay={1}>
        {report.kind === "detail" ? (
          report.rows.length === 0 ? (
            <p className="text-sm text-foreground/40">{t.reports.noResults}</p>
          ) : (
            <div className="overflow-x-auto">
              <p className="mb-4 text-sm font-medium text-foreground/70">
                {report.employeeName ?? report.employeeId}
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-start text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                    <th className="pb-3 pe-4">{t.reports.memberCol}</th>
                    <th className="pb-3">{t.reports.startCol}</th>
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
                      <td className="py-3 font-mono text-xs text-foreground/60">
                        {row.joinDate ? formatDate(row.joinDate, dateFormat) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : report.rows.length === 0 && report.unassignedCount === 0 ? (
          <p className="text-sm text-foreground/40">{t.reports.noResults}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-start text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pe-4">{t.reports.employeeCol}</th>
                  <th className="pb-3 pe-4 text-end">{t.reports.countCol}</th>
                  <th className="pb-3 text-end">{t.reports.viewMembers}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => (
                  <tr key={row.employeeId} className="py-3 transition-colors hover:bg-black/[0.02]">
                    <td className="py-3 pe-4 font-medium">{row.employeeName}</td>
                    <td className="py-3 pe-4 text-end">{row.count.toLocaleString()}</td>
                    <td className="py-3 text-end">
                      <Link
                        href={`/app/reports/registrations-by-employee?employeeId=${row.employeeId}${dateFrom ? `&dateFrom=${dateFrom}` : ""}${dateTo ? `&dateTo=${dateTo}` : ""}`}
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        {t.reports.viewMembers}
                      </Link>
                    </td>
                  </tr>
                ))}
                {report.unassignedCount > 0 && (
                  <tr className="py-3">
                    <td className="py-3 pe-4 font-medium text-foreground/60">{t.reports.unassignedLabel}</td>
                    <td className="py-3 pe-4 text-end text-foreground/60">{report.unassignedCount.toLocaleString()}</td>
                    <td className="py-3" />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
