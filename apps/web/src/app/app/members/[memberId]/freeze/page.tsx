"use server";

import { getMember } from "@/lib/members";
import { listMembershipsForMember, listFreezesForMembership, createFreeze } from "@/lib/memberships";
import { getMembershipPlan } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/date-format";
import DateInput from "@/components/date-input";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ memberId: string }> };

export default async function FreezeMembershipPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships, settings] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const activeMembership = memberships.find((ms) => ms.status === "active") ?? null;

  const plan = activeMembership ? await getMembershipPlan(activeMembership.planId).catch(() => null) : null;

  const existingFreezes = activeMembership
    ? await listFreezesForMembership(activeMembership.id)
    : [];

  const today = new Date().toISOString().slice(0, 10);

  async function handleFreeze(formData: FormData) {
    "use server";
    if (!activeMembership) return;

    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    await createFreeze(activeMembership.id, { startDate, endDate });

    redirect(`/app/members/${memberId}`);
  }

  const canFreeze = activeMembership && plan?.freezeAllowed;

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.nav.members}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t.memberships.freeze} — {member.fullName}
        </h1>
        <p className="mt-1 text-sm text-foreground/50">{member.memberNumber}</p>
      </section>

      {!activeMembership && (
        <section className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm">
          <p className="font-medium text-yellow-800">{t.memberships.noActiveMembership}</p>
          <p className="mt-1 text-yellow-700">
            This member has no active membership to freeze.
          </p>
        </section>
      )}

      {activeMembership && !plan?.freezeAllowed && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm">
          <p className="font-medium text-red-800">{t.memberships.freezeNotAllowed}</p>
          <p className="mt-1 text-red-700">
            The plan{" "}
            <span className="font-medium">{plan?.name ?? activeMembership.planId}</span>{" "}
            does not allow membership freezes.
          </p>
        </section>
      )}

      {activeMembership && (
        <section className="rounded-2xl border border-line bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
            {t.memberships.activeMembership}
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-foreground/55">{t.memberships.plan}</dt>
              <dd className="mt-0.5 font-medium">
                {activeMembership.plan?.name ?? activeMembership.planId}
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.memberships.period}</dt>
              <dd className="mt-0.5 font-medium">
                {formatDate(activeMembership.startDate, dateFormat)} → {formatDate(activeMembership.endDate, dateFormat)}
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.memberships.freezePolicy}</dt>
              <dd className="mt-0.5 font-medium">
                {plan?.freezeAllowed
                  ? `${t.plans.freezeAllowed} · up to ${plan.freezeMaxDays ?? "∞"} ${t.memberships.days}`
                  : t.plans.freezeNotAllowed}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {existingFreezes.length > 0 && (
        <section className="rounded-2xl border border-line bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
            {t.memberships.freezeHistory}
          </p>
          <div className="mt-3 grid gap-2">
            {existingFreezes.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-2.5 text-sm"
              >
                <span className="font-medium">
                  {formatDate(f.startDate, dateFormat)} → {formatDate(f.endDate, dateFormat)}
                </span>
                <span className="text-foreground/50 text-xs">
                  {Math.ceil(
                    (new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}{" "}
                  {t.memberships.days}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {canFreeze && (
        <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
          <form action={handleFreeze} className="grid gap-5">
            <div className="grid gap-1.5 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="startDate" className="text-sm font-medium">
                  {t.memberships.freezeStartDate} <span className="text-red-500">*</span>
                </label>
                <DateInput id="startDate" name="startDate" dateFormat={dateFormat} defaultValue={today} required />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="endDate" className="text-sm font-medium">
                  {t.memberships.freezeEndDate} <span className="text-red-500">*</span>
                </label>
                <DateInput id="endDate" name="endDate" dateFormat={dateFormat} required />
              </div>
            </div>

            {plan?.freezeMaxDays && (
              <p className="text-xs text-foreground/50">
                Maximum freeze duration for this plan: {plan.freezeMaxDays} {t.memberships.days}. The membership end date
                will be extended by the freeze duration.
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
              >
                {t.memberships.freeze}
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
      )}

      {!canFreeze && (
        <div className="flex">
          <Link
            href={`/app/members/${memberId}`}
            className="rounded-full border border-line bg-white px-6 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            {t.memberships.backToProfile}
          </Link>
        </div>
      )}
    </div>
  );
}
