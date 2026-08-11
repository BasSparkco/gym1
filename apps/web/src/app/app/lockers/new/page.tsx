"use server";

import { createLocker, createLockersBulk } from "@/lib/lockers";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewLockerPage({ searchParams }: Props) {
  const session = await requireSession();
  const t = await getT();
  const { error } = await searchParams;

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  async function handleCreate(formData: FormData) {
    "use server";
    const lockerNumber = (formData.get("lockerNumber") as string).trim();
    const sizeValue = formData.get("size") as string;
    const size = sizeValue === "small" || sizeValue === "medium" || sizeValue === "large" ? sizeValue : null;
    const monthlyPrice = Number(formData.get("monthlyPrice")) || 0;
    const quantity = Math.max(1, parseInt(formData.get("quantity") as string, 10) || 1);

    try {
      if (quantity > 1) {
        await createLockersBulk({
          branchId: session.branch.id,
          startNumber: lockerNumber,
          quantity,
          size,
          monthlyPrice,
        });
      } else {
        await createLocker({
          branchId: session.branch.id,
          lockerNumber,
          size,
          monthlyPrice,
        });
      }
    } catch (err) {
      let message = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(message) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // not JSON, use as-is
      }
      redirect(`/app/lockers/new?error=${encodeURIComponent(message)}`);
    }

    redirect("/app/lockers");
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.lockers}
        title={t.lockers.newLocker}
        description={t.branches.title + ": " + session.branch.name}
      />

      {error && (
        <section className="animate-scale-in rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {decodeURIComponent(error)}
        </section>
      )}

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="lockerNumber" className="text-sm font-medium">
                {t.lockers.lockerNumber} <span className="text-red-500">*</span>
              </label>
              <input
                id="lockerNumber"
                name="lockerNumber"
                required
                placeholder="e.g. 1"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="quantity" className="text-sm font-medium">
                {t.lockers.quantity}
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                defaultValue="1"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <p className="text-xs text-foreground/50">{t.lockers.quantityHelp}</p>
            </div>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="size" className="text-sm font-medium">
                {t.lockers.size}
              </label>
              <select
                id="size"
                name="size"
                defaultValue=""
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">{t.lockers.sizeNone}</option>
                <option value="small">{t.lockers.sizeSmall}</option>
                <option value="medium">{t.lockers.sizeMedium}</option>
                <option value="large">{t.lockers.sizeLarge}</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="monthlyPrice" className="text-sm font-medium">
                {t.lockers.monthlyPrice} <span className="text-red-500">*</span>
              </label>
              <input
                id="monthlyPrice"
                name="monthlyPrice"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="e.g. 30"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<Plus className="h-4 w-4" strokeWidth={2} />}>
              {t.lockers.createLocker}
            </Button>
            <Button href="/app/lockers" variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
