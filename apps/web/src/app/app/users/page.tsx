import { listUsers, listRoles } from "@/lib/users";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { apiBaseUrl } from "@/lib/auth";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { BadgeTone } from "@/components/ui/badge";
import { UsersGrid } from "@/components/users/users-grid";
import type { EmployeeOption } from "@/components/employee-combobox";
import { UserPlus, ShieldCheck } from "lucide-react";

const roleTone: Record<string, BadgeTone> = {
  owner: "brand",
  manager: "accent",
};

function roleLabelKey(roleId: string): "owner" | "manager" | "frontDesk" {
  return roleId === "owner" ? "owner" : roleId === "manager" ? "manager" : "frontDesk";
}

function roleDescriptionKey(roleId: string): "ownerDescription" | "managerDescription" | "frontDeskDescription" {
  return roleId === "owner"
    ? "ownerDescription"
    : roleId === "manager"
      ? "managerDescription"
      : "frontDeskDescription";
}

export default async function UsersPage() {
  const session = await requireSession();
  const t = await getT();
  const [users, employees, roles] = await Promise.all([listUsers(), listEmployees(), listRoles()]);
  const canCreate = session.role === "owner";
  const canEdit = session.role === "owner" || session.role === "manager";
  const roleCounts = new Map<string, number>();
  for (const user of users) {
    roleCounts.set(user.role, (roleCounts.get(user.role) ?? 0) + 1);
  }

  const employeesById: Record<string, EmployeeOption> = Object.fromEntries(
    employees.map((e) => [e.id, { id: e.id, fullName: e.fullName, employeeNumber: e.employeeNumber }]),
  );

  const linkableEmployeesByUser: Record<string, EmployeeOption[]> = {};
  if (canEdit) {
    for (const u of users) {
      const linkedElsewhere = new Set(
        users.filter((other) => other.id !== u.id && other.employeeId).map((other) => other.employeeId as string),
      );
      linkableEmployeesByUser[u.id] = employees
        .filter((e) => e.status === "active" && (e.id === u.employeeId || !linkedElsewhere.has(e.id)))
        .map((e) => ({ id: e.id, fullName: e.fullName, employeeNumber: e.employeeNumber }));
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.usersRoles}
        title={t.users.staffUsers}
        description={formatDict(t.users.listDescription, { count: users.length, plural: users.length !== 1 ? "s" : "", tenant: session.tenant.name })}
        actions={
          canCreate && (
            <Button href="/app/users/new" variant="primary" icon={<UserPlus className="h-4 w-4" strokeWidth={2} />}>
              {t.users.newUser}
            </Button>
          )
        }
      />

      {roles.length > 0 && (
        <section className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {roles.map((role, index) => (
            <Card key={role.id} animate delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}>
              <Badge tone={roleTone[role.id] ?? "neutral"} className="font-semibold">
                {t.roles[roleLabelKey(role.id)]}
              </Badge>
              <p className="mt-3 text-2xl font-bold tracking-tight font-mono">
                {roleCounts.get(role.id) ?? 0}
              </p>
              <p className="mt-1 text-xs text-foreground/55 line-clamp-2">
                {t.roles[roleDescriptionKey(role.id)]}
              </p>
            </Card>
          ))}
        </section>
      )}

      {users.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="h-5 w-5" strokeWidth={2} />} title={t.users.noUsers} />
      ) : (
        <UsersGrid
          users={users}
          employeesById={employeesById}
          currentUserId={session.id}
          canEdit={canEdit}
          linkableEmployeesByUser={linkableEmployeesByUser}
          roleTone={roleTone}
          apiBaseUrl={apiBaseUrl}
          t={t}
        />
      )}

      <section>
        <Link
          href="/app/roles"
          className="text-sm font-medium text-brand underline-offset-4 hover:underline"
        >
          {t.users.viewRoles}
        </Link>
      </section>
    </div>
  );
}
