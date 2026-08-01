"use server";

import { getMember, getMemberDebt } from "@/lib/members";
import { listMembershipsForMember } from "@/lib/memberships";
import { listEnrollmentsForMember } from "@/lib/training-programs";
import { listLockerRentalsForMember } from "@/lib/lockers";
import { createPayment, listPaymentsForMember } from "@/lib/payments";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getActiveCurrencySymbol } from "@/lib/currency";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/date-format";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import PaymentFormFields, { type DebtItem } from "./payment-form-fields";

type Props = { params: Promise<{ memberId: string }> };

export default async function RecordPaymentPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships, enrollments, lockerRentals, payments, debt, settings] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
    listEnrollmentsForMember(memberId),
    listLockerRentalsForMember(memberId),
    listPaymentsForMember(memberId),
    getMemberDebt(memberId),
    getSettings(),
  ]);
  const currencySymbol = await getActiveCurrencySymbol(member.homeBranchId);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  // Same "what's actually owed" filter as DebtService.computeMemberDebt —
  // draft memberships haven't started yet, cancelled charges were voided.
  // chargeDate drives the payoff order below, oldest charge first.
  const unallocatedItems = [
    ...memberships
      .filter((ms) => ms.status !== "draft" && ms.status !== "cancelled")
      .map((ms) => ({
        key: `membership-${ms.id}`,
        kind: "membership" as const,
        label: `${t.payments.membership}: ${ms.plan?.name ?? ms.planId}`,
        statusLabel: t.status[ms.status],
        amount: ms.finalPrice,
        membershipId: ms.id,
        chargeDate: ms.startDate,
      })),
    ...enrollments
      .filter((e) => e.status !== "cancelled")
      .map((e) => ({
        key: `course-${e.programId}`,
        kind: "course" as const,
        label: `${t.payments.course}: ${e.program.name}`,
        statusLabel: t.status[e.status],
        amount: e.finalPrice,
        membershipId: undefined as string | undefined,
        chargeDate: e.enrolledAt,
      })),
    ...lockerRentals
      .filter((r) => r.status !== "cancelled")
      .map((r) => ({
        key: `locker-${r.id}`,
        kind: "locker" as const,
        label: `${t.payments.locker}: #${r.locker?.lockerNumber ?? r.lockerId}`,
        statusLabel: t.status[r.status],
        amount: r.finalPrice,
        membershipId: undefined as string | undefined,
        chargeDate: r.startDate,
      })),
  ].sort((a, b) => a.chargeDate.localeCompare(b.chargeDate));

  // Payments aren't earmarked to a specific charge (see DebtService) — a
  // member just pays down whatever they owe. To show a sensible "remaining"
  // figure per item instead of always the gross price, net the total already
  // paid against charges oldest-first, so the totals line up with the net
  // "Current debt" figure instead of double-counting money already received.
  let unpaidPool = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const debtItems: DebtItem[] = unallocatedItems.map((item) => {
    const paidTowards = Math.min(item.amount, unpaidPool);
    unpaidPool -= paidTowards;
    return {
      key: item.key,
      kind: item.kind,
      label: item.label,
      statusLabel: item.statusLabel,
      amount: item.amount,
      membershipId: item.membershipId,
      remaining: item.amount - paidTowards,
    };
  });

  const now = new Date().toISOString().slice(0, 16);

  async function handleCreate(formData: FormData) {
    "use server";
    const membershipId = (formData.get("membershipId") as string) || undefined;
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

      {payments.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm">
          <p className="mb-2 font-medium">{t.payments.paymentsMade}</p>
          <div className="grid gap-1.5">
            {payments
              .slice()
              .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
              .map((pmt) => (
                <div
                  key={pmt.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-3 py-2 text-xs"
                >
                  <span className="font-mono font-semibold">
                    {currencySymbol}
                    {pmt.amount.toLocaleString()}
                  </span>
                  <span className="capitalize text-foreground/50">{pmt.paymentMethod}</span>
                  <span className="font-mono text-foreground/40">{formatDateTime(pmt.paymentDate, dateFormat)}</span>
                  <span className="ms-auto uppercase tracking-wide text-foreground/40">
                    {t.status[pmt.status as keyof typeof t.status] ?? pmt.status}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <PaymentFormFields
            items={debtItems}
            debt={debt}
            currencySymbol={currencySymbol}
            labels={{
              paidFor: t.payments.paidFor,
              allDebts: t.payments.allDebts,
              noDebtItems: t.payments.noDebtItems,
              amount: t.payments.amount,
              paidOfTotal: t.payments.paidOfTotal,
            }}
          />

          <div className="grid gap-1.5 sm:grid-cols-2">
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

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
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
