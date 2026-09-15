"use server";

import { getMember } from "@/lib/members";
import { listMembershipsForMember, updateMembership } from "@/lib/memberships";
import { listMembershipPlans } from "@/lib/membership-plans";
import { listDiscountTypes } from "@/lib/discount-types";
import { requireSession } from "@/lib/session";
import { getT, getLang } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getActiveCurrencySymbol } from "@/lib/currency";
import { formatDate } from "@/lib/date-format";
import { redirect } from "next/navigation";
import EditMembershipFormFields from "./edit-membership-form-fields";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PencilLine } from "lucide-react";

type Props = {
  params: Promise<{ memberId: string; membershipId: string }>;
  searchParams: Promise<{ error?: string }>;
};

const PLAN_CHANGE_WINDOW_DAYS = 14;

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export default async function EditMembershipPlanPage({ params, searchParams }: Props) {
  const { memberId, membershipId } = await params;
  const { error } = await searchParams;
  await requireSession();
  const t = await getT();
  const lang = await getLang();

  const [member, memberships, plans, settings, discountTypes] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
    listMembershipPlans(),
    getSettings(),
    listDiscountTypes(),
  ]);
  const membership = memberships.find((ms) => ms.id === membershipId);
  const today = new Date().toISOString().slice(0, 10);

  // Same eligibility rule the backend enforces — only an active membership
  // still within its 2-week "change your mind" window can switch plans.
  // Navigating here directly once that's no longer true just bounces back.
  if (!membership || membership.status !== "active" || daysBetween(membership.startDate, today) > PLAN_CHANGE_WINDOW_DAYS) {
    redirect(`/app/members/${memberId}`);
  }

  const currencySymbol = await getActiveCurrencySymbol(member.homeBranchId);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  async function handleUpdate(formData: FormData) {
    "use server";
    const planId = formData.get("planId") as string;
    const discountTypeId = (formData.get("discountTypeId") as string) || null;
    const rawDiscountPercent = formData.get("discountPercent") as string;
    const discountPercent = rawDiscountPercent ? Number(rawDiscountPercent) : undefined;

    try {
      await updateMembership(membershipId, {
        planId,
        discountTypeId,
        discountPercent: discountPercent !== undefined && !isNaN(discountPercent) ? discountPercent : undefined,
      });
    } catch (err) {
      let message = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(message) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // not JSON, use as-is
      }
      redirect(
        `/app/members/${memberId}/memberships/${membershipId}/edit?error=${encodeURIComponent(message)}`,
      );
    }

    redirect(`/app/members/${memberId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.members}
        title={`${t.memberships.changePlan} — ${member.fullName}`}
        description={member.memberNumber}
      />

      {error && (
        <section className="animate-scale-in rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {decodeURIComponent(error)}
        </section>
      )}

      <section className="rounded-2xl border border-line bg-surface-muted px-5 py-4 text-sm">
        <p className="text-foreground/60">{t.memberships.changePlanDescription}</p>
        <p className="mt-2">
          <span className="text-foreground/45">{t.memberships.currentPlan}: </span>
          <span className="font-medium">
            {membership.plan?.name ?? membership.planId} — {currencySymbol}
            {membership.finalPrice}
          </span>
          <span className="ms-2 text-foreground/45">
            ({formatDate(membership.startDate, dateFormat)} → {formatDate(membership.endDate, dateFormat)})
          </span>
        </p>
      </section>

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleUpdate} className="grid gap-5">
          <EditMembershipFormFields
            plans={plans}
            discountTypes={discountTypes}
            lang={lang}
            startDate={membership.startDate}
            dateFormat={dateFormat}
            currencySymbol={currencySymbol}
            initialPlanId={membership.planId}
            initialDiscountTypeId={membership.discountTypeId ?? ""}
            initialDiscountPercent={membership.discountPercent || ""}
            labels={{
              membershipPlan: t.memberships.newPlan,
              newEndDate: t.memberships.endDate,
              regularPrice: t.memberships.regularPrice,
              discountType: t.memberships.discountType,
              discountTypeNone: t.memberships.discountTypeNone,
              discountPercent: t.memberships.discountPercent,
              finalPrice: t.memberships.finalPrice,
              daysUnit: t.plans.daysUnit,
              sessionsUnit: t.plans.sessionsUnit,
            }}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<PencilLine className="h-4 w-4" strokeWidth={2} />}>
              {t.memberships.changePlan}
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
