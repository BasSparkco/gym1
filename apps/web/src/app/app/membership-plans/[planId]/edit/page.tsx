"use server";

import { getMembershipPlan, updateMembershipPlan } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ planId: string }> };

export default async function EditMembershipPlanPage({ params }: Props) {
  const { planId } = await params;
  await requireSession();
  const t = await getT();
  const plan = await getMembershipPlan(planId);

  async function handleUpdate(formData: FormData) {
    "use server";
    const planType = formData.get("planType") as "duration" | "session";
    await updateMembershipPlan(planId, {
      name: (formData.get("name") as string) || undefined,
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
    redirect(`/app/membership-plans/${planId}`);
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.nav.membershipPlans}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.plans.editPlan}</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">{plan.name}</p>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleUpdate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t.plans.planName} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={plan.name}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="planType" className="text-sm font-medium">{t.plans.planType}</label>
              <select
                id="planType"
                name="planType"
                defaultValue={plan.planType}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="duration">{t.plans.durationBased}</option>
                <option value="session">{t.plans.sessionBased}</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="durationDays" className="text-sm font-medium">
                {t.plans.duration} (days) <span className="text-foreground/40 font-normal">— duration plans</span>
              </label>
              <select
                id="durationDays"
                name="durationDays"
                defaultValue={plan.durationDays ?? 30}
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
                {t.plans.sessionCount} <span className="text-foreground/40 font-normal">— session plans</span>
              </label>
              <input
                id="sessionCount"
                name="sessionCount"
                type="number"
                min="1"
                defaultValue={plan.sessionCount}
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
                defaultValue={plan.price}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="allowAllBranches" className="text-sm font-medium">{t.plans.branchAccess}</label>
              <select
                id="allowAllBranches"
                name="allowAllBranches"
                defaultValue={plan.allowAllBranches ? "true" : "false"}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="true">{t.plans.allBranches}</option>
                <option value="false">{t.plans.homeBranchOnly}</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="freezeAllowed" className="text-sm font-medium">{t.plans.freezePolicy}</label>
              <select
                id="freezeAllowed"
                name="freezeAllowed"
                defaultValue={plan.freezeAllowed ? "true" : "false"}
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
              defaultValue={plan.freezeMaxDays}
              placeholder="e.g. 14"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              {t.actions.saveChanges}
            </button>
            <Link
              href={`/app/membership-plans/${planId}`}
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
