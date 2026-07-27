"use server";

import { getEmployeeAttendanceReport } from "@/lib/employee-attendance";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = { searchParams: Promise<{ dateFrom?: string; dateTo?: string }> };

function defaultRange() {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return {
    dateFrom: first.toISOString().slice(0, 10),
    dateTo: now.toISOString().slice(0, 10),
  };
}

export default async function EmployeeAttendanceReportPage({ searchParams }: Props) {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const params = await searchParams;
  const fallback = defaultRange();
  const dateFrom = params.dateFrom || fallback.dateFrom;
  const dateTo = params.dateTo || fallback.dateTo;

  const report = await getEmployeeAttendanceReport(dateFrom, dateTo);
  const hasData = report.employees.some((e) => e.days.length > 0);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.attendance.reportTitle}
        description={t.attendance.reportDescription}
      />

      <Card animate>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="dateFrom" className="text-sm font-medium">
              {t.attendance.dateFrom}
            </label>
            <input
              id="dateFrom"
              name="dateFrom"
              type="date"
              defaultValue={dateFrom}
              className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="dateTo" className="text-sm font-medium">
              {t.attendance.dateTo}
            </label>
            <input
              id="dateTo"
              name="dateTo"
              type="date"
              defaultValue={dateTo}
              className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            {t.attendance.filter}
          </Button>
        </form>
      </Card>

      <Card animate delay={1}>
        {!hasData ? (
          <p className="text-sm text-foreground/60">{t.attendance.noAttendanceData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pr-4">{t.employees.fullName}</th>
                  <th className="pb-3 pr-4 text-center">{t.attendance.daysPresent}</th>
                  <th className="pb-3 text-center">{t.attendance.totalHours}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.employees.map((employee) => (
                  <tr key={employee.employeeId} className="align-top">
                    <td className="py-3 pr-4">
                      <details>
                        <summary className="cursor-pointer font-medium hover:text-brand">
                          {employee.fullName}
                        </summary>
                        {employee.days.length > 0 && (
                          <ul className="mt-2 grid gap-1 text-xs text-foreground/60">
                            {employee.days.map((day) => (
                              <li key={day.date} className="font-mono">
                                {day.date} ·{" "}
                                {new Date(day.checkInTime).toLocaleTimeString()} –{" "}
                                {day.checkOutTime
                                  ? new Date(day.checkOutTime).toLocaleTimeString()
                                  : t.attendance.stillCheckedIn}
                              </li>
                            ))}
                          </ul>
                        )}
                      </details>
                      <p className="mt-0.5 font-mono text-xs text-foreground/50">
                        {employee.employeeNumber}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-center font-mono">
                      {employee.totals.daysPresent}
                    </td>
                    <td className="py-3 text-center font-mono">
                      {employee.totals.totalHours}
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
