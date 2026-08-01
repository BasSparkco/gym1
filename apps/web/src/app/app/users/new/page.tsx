"use server";

import { createUser, listUsers } from "@/lib/users";
import { listBranches } from "@/lib/branches";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import EmployeeCombobox from "@/components/employee-combobox";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default async function NewUserPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const [branches, employees, users] = await Promise.all([
    listBranches(),
    listEmployees(),
    listUsers(),
  ]);

  // Only employees without an account can be linked (one account per employee).
  const linkedEmployeeIds = new Set(
    users.map((u) => u.employeeId).filter(Boolean),
  );
  const linkableEmployees = employees.filter(
    (e) => e.status === "active" && !linkedEmployeeIds.has(e.id),
  );

  async function handleCreate(formData: FormData) {
    "use server";
    const branchId = formData.get("branchId") as string;
    const selectedBranch = branches.find((b) => b.id === branchId);

    const user = await createUser({
      email: formData.get("email") as string,
      username: formData.get("username") as string,
      role: formData.get("role") as UserRole,
      password: formData.get("password") as string,
      branchId: branchId || session.branch.id,
      branchName: selectedBranch?.name ?? session.branch.name,
      employeeId: formData.get("employeeId") as string,
    });
    redirect(`/app/users/${user.id}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.usersRoles}
        title={t.users.newStaffUser}
        description="Create a staff account. Email, username, role, password, and a linked employee are required."
      />

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="username" className="text-sm font-medium">
              {t.users.username} <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              name="username"
              required
              minLength={3}
              maxLength={32}
              pattern="[a-z0-9._-]+"
              placeholder="e.g. rania.k"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="text-xs text-foreground/50">
              Used to sign in, along with email. Lowercase letters, numbers, dots, hyphens, and underscores only.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              {t.users.email} <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="e.g. rania@sparkgym.local"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="role" className="text-sm font-medium">
              {t.users.role} <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              name="role"
              required
              defaultValue="front-desk"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="front-desk">Front Desk</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="branchId" className="text-sm font-medium">
              {t.users.homeBranch}
            </label>
            <select
              id="branchId"
              name="branchId"
              defaultValue={session.branch.id}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium">
              {t.users.linkToEmployee} <span className="text-red-500">*</span>
            </label>
            <EmployeeCombobox
              name="employeeId"
              options={linkableEmployees.map((e) => ({
                id: e.id,
                fullName: e.fullName,
                employeeNumber: e.employeeNumber,
              }))}
              placeholder={t.users.searchEmployee}
              required
            />
            <p className="text-xs text-foreground/50">{t.users.linkToEmployeeHint}</p>
            {linkableEmployees.length === 0 && (
              <p className="text-xs text-red-600">{t.users.noLinkableEmployees}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              {t.users.password} <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Min. 6 characters"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<UserPlus className="h-4 w-4" strokeWidth={2} />}>
              {t.users.createUser}
            </Button>
            <Button href="/app/users" variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
