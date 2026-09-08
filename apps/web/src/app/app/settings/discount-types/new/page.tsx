"use server";

import { createDiscountType } from "@/lib/discount-types";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Percent } from "lucide-react";

export default async function NewDiscountTypePage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  async function handleCreate(formData: FormData) {
    "use server";
    await createDiscountType({
      name: (formData.get("name") as string).trim(),
      description: (formData.get("description") as string).trim() || undefined,
    });
    redirect("/app/settings/discount-types");
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={t.settings.discountTypesTitle} title={t.settings.discountTypeAddButton} />

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t.settings.discountTypeName} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Student"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="description" className="text-sm font-medium">
              {t.settings.discountTypeDescriptionField}
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<Percent className="h-4 w-4" strokeWidth={2} />}>
              {t.settings.discountTypeCreate}
            </Button>
            <Button href="/app/settings/discount-types" variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
