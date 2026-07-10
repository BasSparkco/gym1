"use server";

import { getUser, updateUser, listUsers } from "@/lib/users";
import { getEmployee, listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import EmployeeCombobox from "@/components/employee-combobox";
import Link from "next/link";
import { redirect } from "next/navigation";

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

  async function handleLinkEmployee(formData: FormData) {
    "use server";
    const employeeId = formData.get("employeeId") as string;
    await updateUser(userId, { employeeId });
    redirect(`/app/users/${userId}`);
  }

  const roleBadgeStyle =
    user.role === "owner"
      ? "bg-brand/10 text-brand"
      : user.role === "manager"
      ? "bg-accent/10 text-accent"
      : "bg-gray-100 text-gray-600";

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.usersRoles}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeStyle}`}>
              {user.role}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground/60">{user.email}</p>
        </div>
        <Link
          href="/app/users"
          className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.users.allUsers}
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.users.staffDetails}
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.users.fullName}</dt>
              <dd className="mt-0.5 font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.users.email}</dt>
              <dd className="mt-0.5 font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.users.username}</dt>
              <dd className="mt-0.5 font-mono">{user.username}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.users.role}</dt>
              <dd className="mt-0.5 font-medium capitalize">{user.role}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.users.homeBranch}</dt>
              <dd className="mt-0.5 font-medium">{user.branch.name}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.users.linkedEmployee}</dt>
              <dd className="mt-0.5 font-medium">
                {linkedEmployee ? (
                  <Link
                    href={`/app/employees/${linkedEmployee.id}`}
                    className="text-brand hover:underline"
                  >
                    {linkedEmployee.fullName}{" "}
                    <span className="font-mono text-xs text-foreground/50">
                      {linkedEmployee.employeeNumber}
                    </span>
                  </Link>
                ) : (
                  <span className="font-medium text-red-600">{t.users.notLinked}</span>
                )}
              </dd>
            </div>
          </dl>

          {canEdit && (
            <div className="mt-5 border-t border-line pt-5">
              <p className="text-sm font-medium">{t.users.editLink}</p>
              <form action={handleLinkEmployee} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <EmployeeCombobox
                    name="employeeId"
                    options={linkableEmployees.map((e) => ({
                      id: e.id,
                      fullName: e.fullName,
                      employeeNumber: e.employeeNumber,
                    }))}
                    defaultValue={user.employeeId ?? undefined}
                    placeholder={t.users.searchEmployee}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
                >
                  {t.actions.save}
                </button>
              </form>
            </div>
          )}
        </article>

        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            System
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.users.userId}</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground/70">{user.id}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.users.tenant}</dt>
              <dd className="mt-0.5 font-medium">{user.tenant.name}</dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}
