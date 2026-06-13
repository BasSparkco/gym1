"use server";

import { createUser } from "@/lib/users";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/auth";

export default async function NewUserPage() {
  const session = await requireSession();
  const t = await getT();
  const branches = await listBranches();

  async function handleCreate(formData: FormData) {
    "use server";
    const branchId = formData.get("branchId") as string;
    const selectedBranch = branches.find((b) => b.id === branchId);

    const user = await createUser({
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      role: formData.get("role") as UserRole,
      password: formData.get("password") as string,
      branchId: branchId || session.branch.id,
      branchName: selectedBranch?.name ?? session.branch.name,
    });
    redirect(`/app/users/${user.id}`);
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.nav.usersRoles}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.users.newStaffUser}</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">
          Create a staff account. Email, name, role, and password are required.
        </p>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t.users.fullName} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Rania Khalil"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
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
            <button
              type="submit"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              {t.users.createUser}
            </button>
            <Link
              href="/app/users"
              className="rounded-full border border-line bg-white px-6 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              {t.actions.cancel}
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
