"use server";

import { getMember } from "@/lib/members";
import { listMembershipsForMember, createMembership } from "@/lib/memberships";
import { listMembershipPlans } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getActiveCurrencySymbol } from "@/lib/currency";
import { formatDate } from "@/lib/date-format";
import Link from "next/link";
import { redirect } from "next/navigation";
import MembershipFormFields from "./membership-form-fields";

type Props = { params: Promise<{ memberId: string }> };

export default async function SellMembershipPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships, plans, settings] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
    listMembershipPlans(),
    getSettings(),
  ]);
  const currencySymbol = await getActiveCurrencySymbol(member.homeBranchId);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const activeMembership = memberships.find((ms) => ms.status === "active");
  const today = new Date().toISOString().slice(0, 10);

  async function handleCreate(formData: FormData) {
    "use server";
    const planId = formData.get("planId") as string;
    const startDate = formData.get("startDate") as string;
    const rawPrice = formData.get("finalPrice") as string;
    const finalPrice = rawPrice ? Number(rawPrice) : undefined;
    const endDate = (formData.get("endDate") as string) || undefined;

    await createMembership({
      memberId,
      planId,
      startDate,
      endDate,
      finalPrice: finalPrice !== undefined && !isNaN(finalPrice) ? finalPrice : undefined,
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
            ends {formatDate(activeMembership.endDate, dateFormat)}). Selling a new one will be rejected unless the active membership
            is first expired or cancelled.
          </p>
        </section>
      )}

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <MembershipFormFields
            plans={plans}
            today={today}
            dateFormat={dateFormat}
            currencySymbol={currencySymbol}
            labels={{
              membershipPlan: t.memberships.membershipPlan,
              startDate: t.memberships.startDate,
              endDate: t.memberships.endDate,
              finalPrice: t.memberships.finalPrice,
              noPlansAvailable: t.memberships.noPlansAvailable,
              createPlanFirst: t.memberships.createPlanFirst,
            }}
          />

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
