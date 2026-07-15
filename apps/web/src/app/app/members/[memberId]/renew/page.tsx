"use server";

import { getMember } from "@/lib/members";
import { listMembershipsForMember, renewMembership } from "@/lib/memberships";
import { listMembershipPlans } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getActiveCurrencySymbol } from "@/lib/currency";
import Link from "next/link";
import { redirect } from "next/navigation";
import RenewFormFields from "./renew-form-fields";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

type Props = { params: Promise<{ memberId: string }> };

export default async function RenewMembershipPage({ params }: Props) {
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
      <PageHeader
        eyebrow={t.nav.members}
        title={`${t.memberships.renew} — ${member.fullName}`}
        description={member.memberNumber}
      />

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
          <Card>
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
                  <Badge tone={currentMembership.status === "active" ? "success" : "neutral"}>
                    {currentMembership.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
            <form action={handleRenew} className="grid gap-5">
              <RenewFormFields
                plans={plans}
                initialPlanId={currentMembership.planId}
                initialPrice={
                  plans.find((plan) => plan.id === currentMembership.planId)?.price ??
                  currentMembership.finalPrice
                }
                dateFormat={dateFormat}
                defaultStartDate={defaultStartDate}
                currencySymbol={currencySymbol}
                labels={{
                  plan: t.memberships.plan,
                  startDate: t.memberships.startDate,
                  finalPrice: t.memberships.finalPrice,
                  noPlansAvailable: t.memberships.noPlansAvailable,
                }}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" icon={<RefreshCw className="h-4 w-4" strokeWidth={2} />}>
                  {t.memberships.renew}
                </Button>
                <Button href={`/app/members/${memberId}`} variant="secondary">
                  {t.actions.cancel}
                </Button>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
