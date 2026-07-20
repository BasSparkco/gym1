import { listUsers, listRoles } from "@/lib/users";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { BadgeTone } from "@/components/ui/badge";
import { UserPlus, ShieldCheck } from "lucide-react";

const roleTone: Record<string, BadgeTone> = {
  owner: "brand",
  manager: "accent",
};

export default async function UsersPage() {
  const session = await requireSession();
  const t = await getT();
  const [users, employees, roles] = await Promise.all([listUsers(), listEmployees(), listRoles()]);
  const employeeMap = new Map(employees.map((e) => [e.id, e.fullName]));
  const canCreate = session.role === "owner";
  const roleCounts = new Map<string, number>();
  for (const user of users) {
    roleCounts.set(user.role, (roleCounts.get(user.role) ?? 0) + 1);
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
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role, index) => (
            <Card key={role.id} animate delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}>
              <Badge tone={roleTone[role.id] ?? "neutral"} className="font-semibold">
                {role.label}
              </Badge>
              <p className="mt-3 text-2xl font-bold tracking-tight font-mono">
                {roleCounts.get(role.id) ?? 0}
              </p>
              <p className="mt-1 text-xs text-foreground/55 line-clamp-2">{role.description}</p>
            </Card>
          ))}
        </section>
      )}

      <section className="grid gap-3">
        {users.length === 0 && (
          <EmptyState icon={<ShieldCheck className="h-5 w-5" strokeWidth={2} />} title={t.users.noUsers} />
        )}
        {users.map((user, index) => (
          <Card
            key={user.id}
            hoverable
            animate
            delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{user.name}</h2>
                  <Badge tone={roleTone[user.role] ?? "neutral"}>{user.role}</Badge>
                </div>
                <p className="mt-1 text-sm text-foreground/55">{user.email}</p>
                <p className="mt-0.5 text-sm text-foreground/45">
                  {t.users.homeBranch}: {user.branch.name}
                </p>
                <p className="mt-0.5 text-sm text-foreground/45">
                  {t.users.linkedEmployee}:{" "}
                  {user.employeeId ? (
                    employeeMap.get(user.employeeId) ?? "—"
                  ) : (
                    <span className="font-medium text-red-600">{t.users.notLinked}</span>
                  )}
                </p>
              </div>
              {user.id !== session.id && (
                <Button href={`/app/users/${user.id}`} variant="secondary" size="sm" className="shrink-0">
                  {t.actions.view}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </section>

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
