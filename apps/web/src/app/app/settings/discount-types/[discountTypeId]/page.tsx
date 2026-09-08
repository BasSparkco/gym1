"use server";

import {
  getDiscountType,
  updateDiscountType,
  deactivateDiscountType,
  reactivateDiscountType,
} from "@/lib/discount-types";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, ChevronLeft, Ban, RotateCcw } from "lucide-react";

type Props = {
  params: Promise<{ discountTypeId: string }>;
};

export default async function EditDiscountTypePage({ params }: Props) {
  const session = await requireSession();
  const t = await getT();
  const { discountTypeId } = await params;

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  let discountType;
  try {
    discountType = await getDiscountType(discountTypeId);
  } catch {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateDiscountType(discountTypeId, {
      name: (formData.get("name") as string).trim(),
      description: (formData.get("description") as string).trim() || null,
    });
    redirect("/app/settings/discount-types");
  }

  async function handleDeactivate() {
    "use server";
    await deactivateDiscountType(discountTypeId);
    redirect("/app/settings/discount-types");
  }

  async function handleReactivate() {
    "use server";
    await reactivateDiscountType(discountTypeId);
    redirect("/app/settings/discount-types");
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.settings.discountTypesTitle}
        title={discountType.name}
        actions={
          <Button
            href="/app/settings/discount-types"
            variant="secondary"
            icon={<ChevronLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />}
          >
            {t.settings.discountTypesTitle}
          </Button>
        }
      />

      <div>
        <Badge tone={discountType.isActive ? "success" : "neutral"}>
          {discountType.isActive ? t.settings.discountTypeStatusActive : t.settings.discountTypeStatusInactive}
        </Badge>
      </div>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleUpdate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t.settings.discountTypeName} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={discountType.name}
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
              defaultValue={discountType.description ?? ""}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<Save className="h-4 w-4" strokeWidth={2} />}>
              {t.settings.discountTypeUpdate}
            </Button>
            <Button href="/app/settings/discount-types" variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={discountType.isActive ? handleDeactivate : handleReactivate}>
          <Button
            type="submit"
            variant={discountType.isActive ? "danger" : "secondary"}
            icon={
              discountType.isActive ? (
                <Ban className="h-4 w-4" strokeWidth={2} />
              ) : (
                <RotateCcw className="h-4 w-4" strokeWidth={2} />
              )
            }
          >
            {discountType.isActive ? t.settings.discountTypeDeactivate : t.settings.discountTypeReactivate}
          </Button>
        </form>
      </section>
    </div>
  );
}
