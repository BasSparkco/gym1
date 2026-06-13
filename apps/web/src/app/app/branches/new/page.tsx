"use server";

import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createBranch } from "@/lib/branches";

export default async function NewBranchPage() {
  await requireSession();
  const t = await getT();

  async function handleCreate(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const address = (formData.get("address") as string) || undefined;
    const phone = (formData.get("phone") as string) || undefined;
    const status = (formData.get("status") as "active" | "inactive") ?? "active";

    const branch = await createBranch({ name, address, phone, status });
    redirect(`/app/branches/${branch.id}`);
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.nav.branches}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.branches.newBranch}</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">
          Fill in the branch details. Name is required.
        </p>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t.branches.branchName} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Ramallah Main Branch"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="address" className="text-sm font-medium">
              {t.branches.address}
            </label>
            <input
              id="address"
              name="address"
              placeholder="e.g. Al-Irsal St, Ramallah"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="phone" className="text-sm font-medium">
              {t.branches.phone}
            </label>
            <input
              id="phone"
              name="phone"
              placeholder="e.g. +970-2-296-0000"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="status" className="text-sm font-medium">
              {t.branches.statusLabel}
            </label>
            <select
              id="status"
              name="status"
              defaultValue="active"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="active">{t.status.active}</option>
              <option value="inactive">{t.status.inactive}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              {t.branches.createBranch}
            </button>
            <Link
              href="/app/branches"
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
