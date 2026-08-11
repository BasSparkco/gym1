"use server";

import {
  getEntitledBranchIds,
  getMembershipPlan,
  setEntitledBranchIds,
  updateMembershipPlan,
} from "@/lib/membership-plans";
import {
  getEntitledProgramIds,
  listTrainingPrograms,
  setEntitledProgramIds,
} from "@/lib/training-programs";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

type Props = { params: Promise<{ planId: string }> };

export default async function EditMembershipPlanPage({ params }: Props) {
  const { planId } = await params;
  await requireSession();
  const t = await getT();
  const [plan, programs, entitledIds, branches, entitledBranchIds] = await Promise.all([
    getMembershipPlan(planId),
    listTrainingPrograms(),
    getEntitledProgramIds(planId),
    listBranches(),
    getEntitledBranchIds(planId),
  ]);
  const activePrograms = programs.filter((p) => p.active);
  const entitledSet = new Set(entitledIds === "all" ? [] : entitledIds);
  const branchAccessMode: "all" | "home" | "selected" = plan.allowAllBranches
    ? "all"
    : plan.restrictToHomeBranch
      ? "home"
      : "selected";
  const entitledBranchSet = new Set(entitledBranchIds === "all" ? [] : entitledBranchIds);

  async function handleUpdate(formData: FormData) {
    "use server";
    const planType = formData.get("planType") as "duration" | "session";
    const allowAllPrograms = formData.get("allowAllPrograms") === "true";
    const branchAccessMode = formData.get("branchAccessMode") as "all" | "home" | "selected";
    await updateMembershipPlan(planId, {
      name: (formData.get("name") as string) || undefined,
      planType,
      durationDays: planType === "duration" ? Number(formData.get("durationDays")) : undefined,
      sessionCount: planType === "session" ? Number(formData.get("sessionCount")) : undefined,
      price: Number(formData.get("price")) || 0,
      allowAllBranches: branchAccessMode === "all",
      restrictToHomeBranch: branchAccessMode !== "selected",
      allowAllPrograms,
      freezeAllowed: formData.get("freezeAllowed") === "true",
      freezeMaxDays: formData.get("freezeAllowed") === "true" && formData.get("freezeMaxDays")
        ? Number(formData.get("freezeMaxDays"))
        : undefined,
    });
    if (!allowAllPrograms) {
      await setEntitledProgramIds(
        planId,
        formData.getAll("programIds").map(String),
      );
    }
    if (branchAccessMode === "selected") {
      await setEntitledBranchIds(
        planId,
        formData.getAll("branchIds").map(String),
      );
    }
    redirect(`/app/membership-plans/${planId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.membershipPlans}
        title={t.plans.editPlan}
        description={plan.name}
      />

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
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
              <label htmlFor="branchAccessMode" className="text-sm font-medium">{t.plans.branchAccess}</label>
              <select
                id="branchAccessMode"
                name="branchAccessMode"
                defaultValue={branchAccessMode}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="all">{t.plans.allBranches}</option>
                <option value="home">{t.plans.homeBranchOnly}</option>
                <option value="selected">{t.plans.selectedBranchesOnly}</option>
              </select>
              {branches.length > 0 && (
                <div className="mt-1 grid gap-2 rounded-2xl border border-line bg-white px-4 py-3 sm:grid-cols-2">
                  {branches.map((branch) => (
                    <label key={branch.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="branchIds"
                        value={branch.id}
                        defaultChecked={entitledBranchSet.has(branch.id)}
                        className="h-4 w-4 rounded border-line accent-brand"
                      />
                      <span>{branch.name}</span>
                    </label>
                  ))}
                </div>
              )}
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
            <label htmlFor="allowAllPrograms" className="text-sm font-medium">{t.plans.programAccess}</label>
            <select
              id="allowAllPrograms"
              name="allowAllPrograms"
              defaultValue={plan.allowAllPrograms ? "true" : "false"}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="true">{t.plans.allPrograms}</option>
              <option value="false">{t.plans.selectedProgramsOnly}</option>
            </select>
            {activePrograms.length === 0 ? (
              <p className="mt-1 text-sm text-foreground/55">{t.plans.noProgramsYet}</p>
            ) : (
              <div className="mt-1 grid gap-2 rounded-2xl border border-line bg-white px-4 py-3 sm:grid-cols-2">
                {activePrograms.map((program) => (
                  <label key={program.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="programIds"
                      value={program.id}
                      defaultChecked={entitledSet.has(program.id)}
                      className="h-4 w-4 rounded border-line accent-brand"
                    />
                    <span>{program.name}</span>
                  </label>
                ))}
              </div>
            )}
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
            <Button type="submit" variant="primary" icon={<Save className="h-4 w-4" strokeWidth={2} />}>
              {t.actions.saveChanges}
            </Button>
            <Button href={`/app/membership-plans/${planId}`} variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
