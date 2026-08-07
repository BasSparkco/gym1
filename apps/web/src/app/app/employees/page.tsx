"use server";

import { listEmployees, getCoachProfile, type CoachProfile } from "@/lib/employees";
import { listBranches } from "@/lib/branches";
import { listGates } from "@/lib/gates";
import {
  getEmployeeGates,
  listEmployeeVisits,
  type EmployeeGateAccess,
  type EmployeeVisit,
} from "@/lib/employee-attendance";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EmployeeList } from "@/components/employees/employee-list";
import { EmployeesFilterToolbar } from "@/components/employees/employees-filter-toolbar";
import { UserPlus, Users } from "lucide-react";
import { Suspense } from "react";

type Props = { searchParams: Promise<{ q?: string; branch?: string; job?: string }> };

export default async function EmployeesPage({ searchParams }: Props) {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const { q, branch: branchFilter, job: jobFilter } = await searchParams;
  const [allEmployees, branches, settings] = await Promise.all([listEmployees(), listBranches(), getSettings()]);
  const branchMap = Object.fromEntries(branches.map((b) => [b.id, b.name]));
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";
  const viewingAllBranches = session.role === "owner" && settings.ownerDataScope === "all";
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

  const [coachProfiles, gateAccessList, visitsList, allGates] = await Promise.all([
    Promise.all(employees.map((e) => getCoachProfile(e.id))),
    Promise.all(employees.map((e) => getEmployeeGates(e.id))),
    Promise.all(employees.map((e) => listEmployeeVisits(e.id))),
    listGates(),
  ]);
  const coachProfilesByEmployee: Record<string, CoachProfile | null> = Object.fromEntries(
    employees.map((e, i) => [e.id, coachProfiles[i]]),
  );
  const gateAccessByEmployee: Record<string, EmployeeGateAccess> = Object.fromEntries(
    employees.map((e, i) => [e.id, gateAccessList[i]]),
  );
  const recentVisitsByEmployee: Record<string, EmployeeVisit[]> = Object.fromEntries(
    employees.map((e, i) => [e.id, visitsList[i]]),
  );

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

      <Suspense fallback={null}>
        <EmployeesFilterToolbar branches={branches} positions={positions} t={t} showBranchFilter={viewingAllBranches} />
      </Suspense>

      {employees.length === 0 ? (
        <EmptyState icon={<Users className="h-5 w-5" strokeWidth={2} />} title={t.employees.noEmployees} />
      ) : (
        <EmployeeList
          employees={employees}
          branches={branches}
          branchMap={branchMap}
          coachProfilesByEmployee={coachProfilesByEmployee}
          allGates={allGates}
          gateAccessByEmployee={gateAccessByEmployee}
          recentVisitsByEmployee={recentVisitsByEmployee}
          dateFormat={dateFormat}
          t={t}
        />
      )}
    </div>
  );
}
