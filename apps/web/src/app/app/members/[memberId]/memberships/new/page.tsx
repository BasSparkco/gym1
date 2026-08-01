"use server";

import { getMember } from "@/lib/members";
import { listMembershipsForMember, createMembership } from "@/lib/memberships";
import { listMembershipPlans } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getActiveCurrencySymbol } from "@/lib/currency";
import { formatDate } from "@/lib/date-format";
import { redirect } from "next/navigation";
import MembershipFormFields from "./membership-form-fields";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

type Props = {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function SellMembershipPage({ params, searchParams }: Props) {
  const { memberId } = await params;
  const { error } = await searchParams;
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

  // Matches the backend's overlap check in createMembership — active, frozen,
  // and pre-sold draft memberships all still occupy their date range.
  const activeMembership = memberships
    .filter((ms) => ms.status === "active" || ms.status === "frozen" || ms.status === "draft")
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
  const today = new Date().toISOString().slice(0, 10);

  async function handleCreate(formData: FormData) {
    "use server";
    const planId = formData.get("planId") as string;
    const startDate = formData.get("startDate") as string;
    const rawPrice = formData.get("finalPrice") as string;
    const finalPrice = rawPrice ? Number(rawPrice) : undefined;
    const endDate = (formData.get("endDate") as string) || undefined;

    try {
      await createMembership({
        memberId,
        planId,
        startDate,
        endDate,
        finalPrice: finalPrice !== undefined && !isNaN(finalPrice) ? finalPrice : undefined,
        status: "active",
      });
    } catch (err) {
      let message = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(message) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // not JSON, use as-is
      }
      redirect(`/app/members/${memberId}/memberships/new?error=${encodeURIComponent(message)}`);
    }

    redirect(`/app/members/${memberId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.members}
        title={`${t.memberships.sell} — ${member.fullName}`}
        description={member.memberNumber}
      />

      {error && (
        <section className="animate-scale-in rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {decodeURIComponent(error)}
        </section>
      )}

      {activeMembership && (
        <section className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm">
          <p className="font-medium text-yellow-800">{t.memberships.activeMembershipExists}</p>
          <p className="mt-1 text-yellow-700">
            This member has a membership ({activeMembership.plan?.name ?? activeMembership.planId}) running through{" "}
            {formatDate(activeMembership.endDate, dateFormat)}. You can still sell a new one starting after that date —
            otherwise, expire or cancel the current one first.
          </p>
        </section>
      )}

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
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
            <Button
              type="submit"
              variant="primary"
              disabled={plans.length === 0}
              icon={<CreditCard className="h-4 w-4" strokeWidth={2} />}
            >
              {t.memberships.activateMembership}
            </Button>
            <Button href={`/app/members/${memberId}`} variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
