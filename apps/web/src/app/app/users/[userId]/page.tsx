import { getUser, listUsers } from "@/lib/users";
import { getEmployee, listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { apiBaseUrl } from "@/lib/auth";
import { UserProfileCard } from "@/components/users/user-profile-card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/components/ui/badge";

const roleTone: Record<string, BadgeTone> = {
  owner: "brand",
  manager: "accent",
};

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function UserDetailPage({ params }: Props) {
  const { userId } = await params;
  const session = await requireSession();
  const t = await getT();
  const user = await getUser(userId);
  const canEdit = session.role === "owner" || session.role === "manager";

  const [linkedEmployee, employees, allUsers] = await Promise.all([
    user.employeeId ? getEmployee(user.employeeId) : null,
    canEdit ? listEmployees() : [],
    canEdit ? listUsers() : [],
  ]);

  // Only employees without an account (or already linked to this user) can
  // be picked — one account per employee, same rule as the create form.
  const linkedElsewhere = new Set(
    allUsers.filter((u) => u.id !== userId && u.employeeId).map((u) => u.employeeId),
  );
  const linkableEmployees = employees.filter(
    (e) => e.status === "active" && (e.id === user.employeeId || !linkedElsewhere.has(e.id)),
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.usersRoles}
        title={
          <span className="flex items-center gap-3">
            {user.name}
            <Badge tone={roleTone[user.role] ?? "neutral"}>{user.role}</Badge>
          </span>
        }
        description={user.email}
        actions={
          <Button href="/app/users" variant="secondary">
            {t.users.allUsers}
          </Button>
        }
      />

      <UserProfileCard
        userId={userId}
        user={user}
        linkedEmployee={linkedEmployee}
        linkableEmployees={linkableEmployees.map((e) => ({
          id: e.id,
          fullName: e.fullName,
          employeeNumber: e.employeeNumber,
        }))}
        canEdit={canEdit}
        apiBaseUrl={apiBaseUrl}
        t={t}
      />
    </div>
  );
}
