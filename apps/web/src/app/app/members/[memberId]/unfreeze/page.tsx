"use server";

import { getMember } from "@/lib/members";
import { listMembershipsForMember, unfreezeMembership } from "@/lib/memberships";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ memberId: string }> };

export default async function UnfreezeMembershipPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
  ]);

  const frozenMembership = memberships.find((ms) => ms.status === "frozen") ?? null;

  async function handleUnfreeze() {
    "use server";
    if (!frozenMembership) return;

    await unfreezeMembership(frozenMembership.id);
    redirect(`/app/members/${memberId}`);
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.nav.members}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t.memberships.unfreeze} — {member.fullName}
        </h1>
        <p className="mt-1 text-sm text-foreground/50">{member.memberNumber}</p>
      </section>

      {!frozenMembership && (
        <section className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm">
          <p className="font-medium text-yellow-800">{t.memberships.noFrozenMembership}</p>
          <p className="mt-1 text-yellow-700">
            This member has no frozen membership to unfreeze.
          </p>
        </section>
      )}

      {frozenMembership && (
        <>
          <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm">
            <p className="font-medium text-blue-800">{t.status.frozen}</p>
            <p className="mt-1 text-blue-700">
              Re-activating this membership will allow the member to check in again.
              The extended end date set during the freeze will be preserved.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
              {t.memberships.frozenMembership}
            </p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-foreground/55">{t.memberships.plan}</dt>
                <dd className="mt-0.5 font-medium">
                  {frozenMembership.plan?.name ?? frozenMembership.planId}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/55">{t.memberships.period}</dt>
                <dd className="mt-0.5 font-medium">
                  {frozenMembership.startDate} → {frozenMembership.endDate}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/55">{t.members.statusLabel}</dt>
                <dd className="mt-0.5">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {t.status.frozen}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
            <p className="text-sm font-medium">{t.memberships.confirmReactivation}</p>
            <p className="mt-1 text-sm text-foreground/55">
              The membership will be set back to <strong>{t.status.active}</strong>. The member can check in
              immediately after this action.
            </p>
            <form action={handleUnfreeze} className="mt-5 flex gap-3">
              <button
                type="submit"
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
              >
                {t.memberships.reactivateMembership}
              </button>
              <Link
                href={`/app/members/${memberId}`}
                className="rounded-full border border-line bg-white px-6 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
              >
                {t.actions.cancel}
              </Link>
            </form>
          </section>
        </>
      )}

      {!frozenMembership && (
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
