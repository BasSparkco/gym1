"use server";

import { getMember, getMemberDebt } from "@/lib/members";
import { listMembershipsForMember } from "@/lib/memberships";
import { createPayment } from "@/lib/payments";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getActiveCurrencySymbol } from "@/lib/currency";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

type Props = { params: Promise<{ memberId: string }> };

export default async function RecordPaymentPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships, debt] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
    getMemberDebt(memberId),
  ]);
  const currencySymbol = await getActiveCurrencySymbol(member.homeBranchId);

  const activeMemberships = memberships.filter((ms) =>
    ms.status === "active" || ms.status === "draft"
  );
  const now = new Date().toISOString().slice(0, 16);

  async function handleCreate(formData: FormData) {
    "use server";
    const membershipId = formData.get("membershipId") as string;
    const amount = Number(formData.get("amount"));
    const paymentMethod = formData.get("paymentMethod") as "cash" | "card" | "transfer";
    const status = formData.get("status") as "pending" | "paid";
    const paymentDate = (formData.get("paymentDate") as string) + ":00.000Z";

    await createPayment({
      memberId,
      membershipId,
      amount,
      paymentDate,
      paymentMethod,
      status,
    });

    redirect(`/app/members/${memberId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.members}
        title={`${t.payments.recordPayment} — ${member.fullName}`}
        description={member.memberNumber}
      />

      <section
        className={`rounded-2xl border px-5 py-4 text-sm ${debt > 0 ? "border-danger/25 bg-danger/[0.06]" : "border-line bg-surface"}`}
      >
        <p className={`font-mono text-lg font-semibold ${debt > 0 ? "text-danger" : "text-foreground"}`}>
          {t.payments.currentDebt}: {currencySymbol}
          {debt.toLocaleString()}
        </p>
      </section>

      {activeMemberships.length === 0 && (
        <section className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm">
          <p className="font-medium text-yellow-800">{t.payments.noActiveMembership}</p>
          <p className="mt-1 text-yellow-700">
            This member has no active membership to record payment against.{" "}
            <Link href={`/app/members/${memberId}/memberships/new`} className="font-medium underline">
              {t.payments.sellMembershipFirst}
            </Link>
          </p>
        </section>
      )}

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="membershipId" className="text-sm font-medium">
              {t.payments.membership} <span className="text-red-500">*</span>
            </label>
            {memberships.length === 0 ? (
              <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground/50">
                {t.payments.noMembershipsFound}
              </p>
            ) : (
              <select
                id="membershipId"
                name="membershipId"
                required
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Select a membership…</option>
                {memberships
                  .slice()
                  .sort((a, b) => b.startDate.localeCompare(a.startDate))
                  .map((ms) => (
                    <option key={ms.id} value={ms.id}>
                      {ms.plan?.name ?? ms.planId} · {ms.startDate} → {ms.endDate} ·{" "}
                      {ms.status} · {currencySymbol}{ms.finalPrice}
                    </option>
                  ))}
              </select>
            )}
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="amount" className="text-sm font-medium">
                {t.payments.amount} <span className="text-red-500">*</span>
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="e.g. 120"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="paymentMethod" className="text-sm font-medium">
                {t.payments.paymentMethod} <span className="text-red-500">*</span>
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                defaultValue="cash"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="cash">{t.payments.cash}</option>
                <option value="card">{t.payments.card}</option>
                <option value="transfer">{t.payments.transfer}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="status" className="text-sm font-medium">
                {t.payments.statusLabel} <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                defaultValue="paid"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="paid">{t.status.paid}</option>
                <option value="pending">{t.status.pending}</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="paymentDate" className="text-sm font-medium">
                {t.payments.paymentDate} <span className="text-red-500">*</span>
              </label>
              <input
                id="paymentDate"
                name="paymentDate"
                type="datetime-local"
                defaultValue={now}
                required
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={memberships.length === 0}
              icon={<Wallet className="h-4 w-4" strokeWidth={2} />}
            >
              {t.payments.recordPayment}
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
