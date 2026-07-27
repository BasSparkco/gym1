"use server";

import { getEmployee, getCoachProfile } from "@/lib/employees";
import { listBranches } from "@/lib/branches";
import { listGates } from "@/lib/gates";
import { getEmployeeGates, listEmployeeVisits } from "@/lib/employee-attendance";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeProfileView } from "@/components/employees/employee-profile-view";
import {
  updateEmployeeAction,
  toggleEmployeeStatusAction,
  setEmployeeGatesAction,
} from "@/app/app/employees/actions";

type Props = {
  params: Promise<{ employeeId: string }>;
};

export default async function EmployeeDetailPage({ params }: Props) {
  const { employeeId } = await params;
  const session = await requireSession();
  const t = await getT();

  const [employee, branches, settings, coachProfile] = await Promise.all([
    getEmployee(employeeId),
    listBranches(),
    getSettings(),
    getCoachProfile(employeeId),
  ]);
  const [gates, gateAccess, recentVisits] = await Promise.all([
    listGates(employee.branchId),
    getEmployeeGates(employeeId),
    listEmployeeVisits(employeeId),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const branchMap = Object.fromEntries(branches.map((b) => [b.id, b.name]));
  const employeeBranch = branches.find((b) => b.id === employee.branchId);
  const currencySymbol = getCurrencySymbol(employeeBranch?.operatingCurrencyCode);
  const canEdit = session.role === "owner" || session.role === "manager";

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.employees.title}
        title={
          <span className="flex items-center gap-3">
            {employee.fullName}
            <Badge tone={employee.status === "active" ? "success" : "neutral"}>
              {employee.status === "active" ? t.employees.active : t.employees.inactive}
            </Badge>
          </span>
        }
        description={<span className="font-mono">{employee.employeeNumber}</span>}
        actions={
          <Button href="/app/employees" variant="secondary">
            {t.employees.allEmployees}
          </Button>
        }
      />

      <EmployeeProfileView
        employee={employee}
        coachProfile={coachProfile}
        branches={branches}
        branchMap={branchMap}
        dateFormat={dateFormat}
        currencySymbol={currencySymbol}
        canEdit={canEdit}
        t={t}
        updateAction={updateEmployeeAction}
        toggleStatusAction={toggleEmployeeStatusAction}
        gates={gates}
        gateAccess={gateAccess}
        setGatesAction={setEmployeeGatesAction}
        recentVisits={recentVisits}
      />
    </div>
  );
}
