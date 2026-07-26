"use server";

import { createClosedDate } from "@/lib/closed-dates";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function NewClosedDatePage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const branches = await listBranches();

  async function handleCreate(formData: FormData) {
    "use server";
    const date = formData.get("date") as string;
    const reason = (formData.get("reason") as string).trim();
    const branchId = (formData.get("branchId") as string) || undefined;

    await createClosedDate({ branchId, date, reason });

    redirect("/app/closed-dates");
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={t.nav.closedDates} title={t.closedDates.newClosedDate} />

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="date" className="text-sm font-medium">
                {t.closedDates.date} <span className="text-red-500">*</span>
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="branchId" className="text-sm font-medium">
                {t.closedDates.branch}
              </label>
              <select
                id="branchId"
                name="branchId"
                defaultValue=""
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">{t.closedDates.allBranches}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="reason" className="text-sm font-medium">
              {t.closedDates.reason} <span className="text-red-500">*</span>
            </label>
            <input
              id="reason"
              name="reason"
              required
              placeholder={t.closedDates.reasonPlaceholder}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<Plus className="h-4 w-4" strokeWidth={2} />}>
              {t.closedDates.createClosedDate}
            </Button>
            <Button href="/app/closed-dates" variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
