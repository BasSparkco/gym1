"use server";

import { getBranch, updateBranch } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ branchId: string }>;
};

export default async function EditBranchPage({ params }: Props) {
  const { branchId } = await params;
  await requireSession();
  const t = await getT();
  const branch = await getBranch(branchId);

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateBranch(branchId, {
      name: (formData.get("name") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      status: formData.get("status") as "active" | "inactive",
    });
    redirect(`/app/branches/${branchId}`);
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.nav.branches}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.branches.editBranch}</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">{branch.name}</p>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleUpdate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t.branches.branchName} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={branch.name}
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
              defaultValue={branch.address ?? ""}
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
              defaultValue={branch.phone ?? ""}
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
              defaultValue={branch.status}
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
              {t.actions.saveChanges}
            </button>
            <Link
              href={`/app/branches/${branchId}`}
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
