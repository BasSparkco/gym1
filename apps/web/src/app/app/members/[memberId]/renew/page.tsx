"use server";

import { getMember } from "@/lib/members";
import { listMembershipsForMember, renewMembership } from "@/lib/memberships";
import { listMembershipPlans } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ memberId: string }> };

export default async function RenewMembershipPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships, plans] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
    listMembershipPlans(),
  ]);

  const sorted = memberships
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const currentMembership = sorted[0] ?? null;

  const defaultStartDate = currentMembership
    ? (() => {
        const d = new Date(currentMembership.endDate);
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
      })()
    : new Date().toISOString().slice(0, 10);

  async function handleRenew(formData: FormData) {
    "use server";
    if (!currentMembership) return;

    const planId = formData.get("planId") as string;
    const startDate = formData.get("startDate") as string;
    const rawPrice = formData.get("finalPrice") as string;
    const finalPrice = rawPrice ? Number(rawPrice) : undefined;

    await renewMembership(currentMembership.id, {
      planId: planId || undefined,
      startDate: startDate || undefined,
      finalPrice: finalPrice !== undefined && !isNaN(finalPrice) ? finalPrice : undefined,
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
          {t.memberships.renew} — {member.fullName}
        </h1>
        <p className="mt-1 text-sm text-foreground/50">{member.memberNumber}</p>
      </section>

      {!currentMembership && (
        <section className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm">
          <p className="font-medium text-yellow-800">{t.memberships.noMembershipHistory}</p>
          <p className="mt-1 text-yellow-700">
            This member has no membership history.{" "}
            <Link href={`/app/members/${memberId}/memberships/new`} className="underline">
              {t.memberships.sellNewInstead}
            </Link>
          </p>
        </section>
      )}

      {currentMembership && (
        <>
          <section className="rounded-2xl border border-line bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
              {t.memberships.currentMembership}
            </p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-foreground/55">{t.memberships.plan}</dt>
                <dd className="mt-0.5 font-medium">
                  {currentMembership.plan?.name ?? currentMembership.planId}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/55">{t.memberships.period}</dt>
                <dd className="mt-0.5 font-medium">
                  {currentMembership.startDate} → {currentMembership.endDate}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/55">{t.members.statusLabel}</dt>
                <dd className="mt-0.5">
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      currentMembership.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {currentMembership.status}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
            <form action={handleRenew} className="grid gap-5">
              <div className="grid gap-1.5">
                <label htmlFor="planId" className="text-sm font-medium">
                  {t.memberships.plan}{" "}
                  <span className="text-foreground/40 font-normal">
                    — leave unchanged to renew with the same plan
                  </span>
                </label>
                {plans.length === 0 ? (
                  <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground/50">
                    {t.memberships.noPlansAvailable}
                  </p>
                ) : (
                  <select
                    id="planId"
                    name="planId"
                    defaultValue={currentMembership.planId}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
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
                    {t.memberships.startDate}{" "}
                    <span className="text-foreground/40 font-normal">
                      — defaults to day after current end
                    </span>
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={defaultStartDate}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="finalPrice" className="text-sm font-medium">
                    {t.memberships.finalPrice}{" "}
                    <span className="text-foreground/40 font-normal">— leave blank for plan default</span>
                  </label>
                  <input
                    id="finalPrice"
                    name="finalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={`e.g. ${currentMembership.finalPrice}`}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
                >
                  {t.memberships.renew}
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
        </>
      )}
    </div>
  );
}
