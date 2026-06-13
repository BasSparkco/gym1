"use server";

import { getMember } from "@/lib/members";
import { listMembershipsForMember, createMembership } from "@/lib/memberships";
import { listMembershipPlans } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ memberId: string }> };

export default async function SellMembershipPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships, plans] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
    listMembershipPlans(),
  ]);

  const activeMembership = memberships.find((ms) => ms.status === "active");
  const today = new Date().toISOString().slice(0, 10);

  async function handleCreate(formData: FormData) {
    "use server";
    const planId = formData.get("planId") as string;
    const startDate = formData.get("startDate") as string;
    const finalPrice = Number(formData.get("finalPrice"));
    const endDate = (formData.get("endDate") as string) || undefined;

    await createMembership({
      memberId,
      planId,
      startDate,
      endDate,
      finalPrice: isNaN(finalPrice) ? undefined : finalPrice,
      status: "active",
    });

    redirect(`/app/members/${memberId}`);
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.nav.members}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t.memberships.sell} — {member.fullName}
        </h1>
        <p className="mt-1 text-sm text-foreground/50">{member.memberNumber}</p>
      </section>

      {activeMembership && (
        <section className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm">
          <p className="font-medium text-yellow-800">{t.memberships.activeMembershipExists}</p>
          <p className="mt-1 text-yellow-700">
            This member already has an active membership ({activeMembership.plan?.name ?? activeMembership.planId},{" "}
            ends {activeMembership.endDate}). Selling a new one will be rejected unless the active membership
            is first expired or cancelled.
          </p>
        </section>
      )}

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="planId" className="text-sm font-medium">
              {t.memberships.membershipPlan} <span className="text-red-500">*</span>
            </label>
            {plans.length === 0 ? (
              <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground/50">
                {t.memberships.noPlansAvailable}{" "}
                <Link href="/app/membership-plans/new" className="text-brand hover:underline">
                  {t.memberships.createPlanFirst}
                </Link>
              </p>
            ) : (
              <select
                id="planId"
                name="planId"
                required
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Select a plan…</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} — ${plan.price}
                    {plan.planType === "duration"
                      ? ` · ${plan.durationDays}d`
                      : ` · ${plan.sessionCount} sessions`}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="startDate" className="text-sm font-medium">
                {t.memberships.startDate} <span className="text-red-500">*</span>
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={today}
                required
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="endDate" className="text-sm font-medium">
                {t.memberships.endDate}{" "}
                <span className="text-foreground/40 font-normal">— auto-calculated for duration plans</span>
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="finalPrice" className="text-sm font-medium">
              {t.memberships.finalPrice} <span className="text-foreground/40 font-normal">— leave blank to use plan default</span>
            </label>
            <input
              id="finalPrice"
              name="finalPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 120"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={plans.length === 0}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
            >
              {t.memberships.activateMembership}
            </button>
            <Link
              href={`/app/members/${memberId}`}
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
