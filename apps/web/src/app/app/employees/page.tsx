"use server";

import { listEmployees } from "@/lib/employees";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { UserPlus, Users, Filter } from "lucide-react";

type Props = { searchParams: Promise<{ q?: string; branch?: string; job?: string }> };

export default async function EmployeesPage({ searchParams }: Props) {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const { q, branch: branchFilter, job: jobFilter } = await searchParams;
  const [allEmployees, branches] = await Promise.all([listEmployees(), listBranches()]);
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const activeCount = allEmployees.filter((e) => e.status === "active").length;
  const positions = Array.from(
    new Set(allEmployees.map((e) => e.job).filter((job): job is string => Boolean(job))),
  ).sort();

  let employees = allEmployees;
  if (q) {
    const lq = q.toLowerCase();
    employees = employees.filter(
      (e) => e.fullName.toLowerCase().includes(lq) || e.employeeNumber.toLowerCase().includes(lq),
    );
  }
  if (branchFilter) {
    employees = employees.filter((e) => e.branchId === branchFilter);
  }
  if (jobFilter) {
    employees = employees.filter((e) => e.job === jobFilter);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.employees.title}
        title={t.employees.title}
        description={formatDict(t.employees.listDescription, { active: activeCount, total: allEmployees.length, tenant: session.tenant.name })}
        actions={
          <Button href="/app/employees/new" variant="primary" icon={<UserPlus className="h-4 w-4" strokeWidth={2} />}>
            {t.employees.newEmployee}
          </Button>
        }
      />

      <form className="flex flex-wrap items-end gap-3 rounded-[18px] border border-line bg-surface px-6 py-5">
        <label className="grid flex-1 gap-1 text-sm" style={{ minWidth: 200 }}>
          <span className="text-xs font-medium text-foreground/60">{t.employees.searchPlaceholder}</span>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder={t.employees.searchPlaceholder}
            className="rounded-[10px] border border-line bg-white px-4 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-foreground/60">{t.employees.branch}</span>
          <select
            name="branch"
            defaultValue={branchFilter ?? ""}
            className="rounded-[10px] border border-line bg-white px-4 py-2 text-sm"
          >
            <option value="">{t.employees.filterAllBranches}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-foreground/60">{t.employees.job}</span>
          <select
            name="job"
            defaultValue={jobFilter ?? ""}
            className="rounded-[10px] border border-line bg-white px-4 py-2 text-sm"
          >
            <option value="">{t.employees.filterAllPositions}</option>
            {positions.map((job) => (
              <option key={job} value={job}>
                {job}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="primary" size="md" icon={<Filter className="h-4 w-4" strokeWidth={2} />}>
          {t.reports.applyFilter}
        </Button>
      </form>

      <section className="grid gap-3">
        {employees.length === 0 && (
          <EmptyState icon={<Users className="h-5 w-5" strokeWidth={2} />} title={t.employees.noEmployees} />
        )}
        {employees.map((emp, index) => (
          <Card
            key={emp.id}
            hoverable
            animate
            delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{emp.fullName}</h2>
                  <Badge tone={emp.status === "active" ? "success" : "neutral"}>
                    {emp.status === "active" ? t.employees.active : t.employees.inactive}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-foreground/55 font-mono">{emp.employeeNumber}</p>
                <p className="mt-0.5 text-sm text-foreground/45">
                  {t.employees.branch}: {branchMap.get(emp.branchId) ?? emp.branchId}
                </p>
                {emp.user && (
                  <p className="mt-0.5 text-sm text-foreground/45">
                    {t.users.username}: <span className="font-mono">{emp.user.username}</span>
                  </p>
                )}
              </div>
              <Button href={`/app/employees/${emp.id}`} variant="secondary" size="sm" className="shrink-0">
                {t.actions.view}
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
