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
import { UserPlus, Users } from "lucide-react";

export default async function EmployeesPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const [employees, branches] = await Promise.all([listEmployees(), listBranches()]);
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const activeCount = employees.filter((e) => e.status === "active").length;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.employees.title}
        title={t.employees.title}
        description={formatDict(t.employees.listDescription, { active: activeCount, total: employees.length, tenant: session.tenant.name })}
        actions={
          <Button href="/app/employees/new" variant="primary" icon={<UserPlus className="h-4 w-4" strokeWidth={2} />}>
            {t.employees.newEmployee}
          </Button>
        }
      />

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
