"use server";

import { createMembershipPlan } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default async function NewMembershipPlanPage() {
  await requireSession();
  const t = await getT();

  async function handleCreate(formData: FormData) {
    "use server";
    const planType = formData.get("planType") as "duration" | "session";
    const plan = await createMembershipPlan({
      name: formData.get("name") as string,
      planType,
      durationDays: planType === "duration" ? Number(formData.get("durationDays")) : undefined,
      sessionCount: planType === "session" ? Number(formData.get("sessionCount")) : undefined,
      price: Number(formData.get("price")) || 0,
      allowAllBranches: formData.get("allowAllBranches") === "true",
      freezeAllowed: formData.get("freezeAllowed") === "true",
      freezeMaxDays: formData.get("freezeAllowed") === "true" && formData.get("freezeMaxDays")
        ? Number(formData.get("freezeMaxDays"))
        : undefined,
    });
    redirect(`/app/membership-plans/${plan.id}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.membershipPlans}
        title={t.plans.newPlan}
        description="Define the plan type, duration or sessions, pricing, and access rules."
      />

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t.plans.planName} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Monthly Standard"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="planType" className="text-sm font-medium">
                {t.plans.planType} <span className="text-red-500">*</span>
              </label>
              <select
                id="planType"
                name="planType"
                defaultValue="duration"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="duration">{t.plans.durationBased}</option>
                <option value="session">{t.plans.sessionBased}</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="durationDays" className="text-sm font-medium">
                {t.plans.duration} (days) <span className="text-foreground/40 font-normal">— for duration plans</span>
              </label>
              <select
                id="durationDays"
                name="durationDays"
                defaultValue="30"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="30">30 days (1 month)</option>
                <option value="60">60 days (2 months)</option>
                <option value="90">90 days (3 months)</option>
                <option value="180">180 days (6 months)</option>
                <option value="365">365 days (1 year)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="sessionCount" className="text-sm font-medium">
                {t.plans.sessionCount} <span className="text-foreground/40 font-normal">— for session plans</span>
              </label>
              <input
                id="sessionCount"
                name="sessionCount"
                type="number"
                min="1"
                placeholder="e.g. 12"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="price" className="text-sm font-medium">
                {t.plans.defaultPrice} <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="e.g. 120"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="allowAllBranches" className="text-sm font-medium">
                {t.plans.branchAccess}
              </label>
              <select
                id="allowAllBranches"
                name="allowAllBranches"
                defaultValue="true"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="true">{t.plans.allBranches}</option>
                <option value="false">{t.plans.homeBranchOnly}</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="freezeAllowed" className="text-sm font-medium">
                {t.plans.freezePolicy}
              </label>
              <select
                id="freezeAllowed"
                name="freezeAllowed"
                defaultValue="false"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="false">{t.plans.freezeNotAllowed}</option>
                <option value="true">{t.plans.freezeAllowed}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="freezeMaxDays" className="text-sm font-medium">
              {t.plans.maxFreezeDays} <span className="text-foreground/40 font-normal">— leave blank for unlimited</span>
            </label>
            <input
              id="freezeMaxDays"
              name="freezeMaxDays"
              type="number"
              min="1"
              placeholder="e.g. 14"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<PlusCircle className="h-4 w-4" strokeWidth={2} />}>
              {t.plans.createPlan}
            </Button>
            <Button href="/app/membership-plans" variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
