"use server";

import { getLocker, updateLocker, deleteLocker } from "@/lib/lockers";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getActiveCurrencySymbol } from "@/lib/currency";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Save, Trash2, ChevronLeft } from "lucide-react";

type Props = { params: Promise<{ lockerId: string }> };

export default async function LockerDetailPage({ params }: Props) {
  const { lockerId } = await params;
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const [locker, currencySymbol] = await Promise.all([
    getLocker(lockerId),
    getActiveCurrencySymbol(session.branch.id),
  ]);

  async function handleUpdate(formData: FormData) {
    "use server";
    const sizeValue = formData.get("size") as string;
    const size = sizeValue === "small" || sizeValue === "medium" || sizeValue === "large" ? sizeValue : null;
    const status = formData.get("status") as "available" | "occupied" | "maintenance";

    await updateLocker(lockerId, {
      lockerNumber: (formData.get("lockerNumber") as string).trim(),
      size,
      monthlyPrice: Number(formData.get("monthlyPrice")) || 0,
      status,
    });
    redirect("/app/lockers");
  }

  async function handleDelete() {
    "use server";
    await deleteLocker(lockerId);
    redirect("/app/lockers");
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.lockers.title}
        title={`${t.lockers.editLocker} — ${locker.lockerNumber}`}
        actions={
          <Button href="/app/lockers" variant="secondary" icon={<ChevronLeft className="h-4 w-4" strokeWidth={2} />}>
            {t.lockers.allLockers}
          </Button>
        }
      />

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleUpdate} className="grid gap-5">
          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="lockerNumber" className="text-sm font-medium">
                {t.lockers.lockerNumber} <span className="text-red-500">*</span>
              </label>
              <input
                id="lockerNumber"
                name="lockerNumber"
                required
                defaultValue={locker.lockerNumber}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="status" className="text-sm font-medium">
                {t.lockers.statusLabel}
              </label>
              <select
                id="status"
                name="status"
                defaultValue={locker.status}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="available">{t.lockers.statusAvailable}</option>
                <option value="occupied">{t.lockers.statusOccupied}</option>
                <option value="maintenance">{t.lockers.statusMaintenance}</option>
              </select>
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
                defaultValue={locker.size ?? ""}
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
                defaultValue={locker.monthlyPrice}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <p className="text-xs text-foreground/50">{currencySymbol}{locker.monthlyPrice}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<Save className="h-4 w-4" strokeWidth={2} />}>
              {t.lockers.saveChanges}
            </Button>
            <Button href="/app/lockers" variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>

      {session.role === "owner" && (
        <section className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">Danger zone</p>
          <p className="mt-2 text-sm text-red-700">{t.lockers.deleteConfirm}</p>
          <form action={handleDelete} className="mt-4">
            <Button type="submit" variant="danger" icon={<Trash2 className="h-4 w-4" strokeWidth={2} />}>
              {t.lockers.delete}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
