"use server";

import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { createBranch } from "@/lib/branches";
import { COUNTRIES } from "@/lib/countries";
import { CURRENCIES } from "@/lib/currencies";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default async function NewBranchPage() {
  await requireSession();
  const t = await getT();

  async function handleCreate(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const address = (formData.get("address") as string) || undefined;
    const phone = (formData.get("phone") as string) || undefined;
    const countryCode = (formData.get("countryCode") as string) || undefined;
    const operatingCurrencyCode =
      (formData.get("operatingCurrencyCode") as string) || undefined;
    const status = (formData.get("status") as "active" | "inactive") ?? "active";

    const branch = await createBranch({
      name,
      address,
      phone,
      countryCode,
      operatingCurrencyCode,
      status,
    });
    redirect(`/app/branches/${branch.id}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.branches}
        title={t.branches.newBranch}
        description="Fill in the branch details. Name is required."
      />

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
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
            <label htmlFor="countryCode" className="text-sm font-medium">
              {t.branches.country}
            </label>
            <select
              id="countryCode"
              name="countryCode"
              defaultValue=""
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">— Select country —</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} (+{c.dialCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="operatingCurrencyCode" className="text-sm font-medium">
              {t.branches.currency}
            </label>
            <select
              id="operatingCurrencyCode"
              name="operatingCurrencyCode"
              defaultValue="ILS"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
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
            <Button type="submit" variant="primary" icon={<PlusCircle className="h-4 w-4" strokeWidth={2} />}>
              {t.branches.createBranch}
            </Button>
            <Button href="/app/branches" variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
