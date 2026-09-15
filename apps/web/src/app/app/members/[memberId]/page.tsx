import { deleteMember, getMember, getMemberPhotoUrl } from "@/lib/members";
import { listMembershipsForMember } from "@/lib/memberships";
import { cancelPayment, listPaymentsForMember } from "@/lib/payments";
import { listLockerRentalsForMember } from "@/lib/lockers";
import { listEnrollmentsForMember } from "@/lib/training-programs";
import { listBranches } from "@/lib/branches";
import { listAreas } from "@/lib/areas";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";
import Link from "next/link";
import { redirect } from "next/navigation";
import { computeAge, computeBmi, initials } from "@/components/members/member-profile-shared";
import { MemberProfileView, type MemberProfileData } from "@/components/members/member-profile-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";

type Props = {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{
    pinSent?: string;
    pinWaError?: string;
    pinEmailError?: string;
    deleteError?: string;
    cancelPaymentError?: string;
  }>;
};

const MEMBER_ERROR_TRANSLATIONS: Record<string, (t: Awaited<ReturnType<typeof getT>>) => string> = {
  "This member has payment, visit, membership, locker, or course history and cannot be deleted.": (t) =>
    t.members.errorMemberHasHistory,
};

const PAYMENT_ERROR_TRANSLATIONS: Record<string, (t: Awaited<ReturnType<typeof getT>>) => string> = {
  "This payment is already cancelled.": (t) => t.payments.errorPaymentAlreadyCancelled,
};

export default async function MemberProfilePage({ params, searchParams }: Props) {
  const { memberId } = await params;
  const { pinSent, pinWaError, pinEmailError, deleteError, cancelPaymentError } = await searchParams;
  const session = await requireSession();
  const t = await getT();

  async function handleDelete() {
    "use server";
    try {
      await deleteMember(memberId);
    } catch (err) {
      let message = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(message) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // not JSON, use as-is
      }
      message = MEMBER_ERROR_TRANSLATIONS[message]?.(t) ?? message;
      redirect(`/app/members/${memberId}?deleteError=${encodeURIComponent(message)}`);
    }
    redirect("/app/members");
  }

  async function handleCancelPayment(formData: FormData) {
    "use server";
    const paymentId = formData.get("paymentId") as string;
    try {
      await cancelPayment(paymentId);
    } catch (err) {
      let message = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(message) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // not JSON, use as-is
      }
      message = PAYMENT_ERROR_TRANSLATIONS[message]?.(t) ?? message;
      redirect(`/app/members/${memberId}?cancelPaymentError=${encodeURIComponent(message)}`);
    }
    redirect(`/app/members/${memberId}`);
  }

  const [member, memberships, payments, lockerRentals, courseEnrollments, branches, areas, employees, settings] =
    await Promise.all([
      getMember(memberId),
      listMembershipsForMember(memberId),
      listPaymentsForMember(memberId),
      listLockerRentalsForMember(memberId),
      listEnrollmentsForMember(memberId),
      listBranches(),
      listAreas(),
      listEmployees(),
      getSettings(),
    ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const homeBranch = branches.find((b) => b.id === member.homeBranchId);
  const currencySymbol = getCurrencySymbol(homeBranch?.operatingCurrencyCode);
  const registeredEmployee = employees.find((e) => e.id === member.registeredEmployeeId);
  const area = areas.find((a) => a.id === member.areaId);

  const data: MemberProfileData = {
    member,
    avatar: initials(member.fullName),
    photoUrl: getMemberPhotoUrl(member.pictureUrl),
    branchName: homeBranch?.name ?? "—",
    areaName: area?.name,
    currencySymbol,
    registeredEmployeeName: registeredEmployee?.fullName,
    age: computeAge(member.dateOfBirth),
    bmi: computeBmi(member.height, member.weight),
    memberships: memberships
      .slice()
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((ms) => ({
        id: ms.id,
        planId: ms.planId,
        planName: ms.plan?.name ?? ms.planId,
        startDate: ms.startDate,
        endDate: ms.endDate,
        status: ms.status,
        finalPrice: ms.finalPrice,
      })),
    payments: payments
      .slice()
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
      .map((p) => ({
        id: p.id,
        amount: p.amount,
        paymentDate: p.paymentDate,
        status: p.status,
        paymentMethod: p.paymentMethod,
      })),
    lockerRentals: lockerRentals.map((r) => ({
      id: r.id,
      lockerNumber: r.locker?.lockerNumber ?? r.lockerId,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      finalPrice: r.finalPrice,
    })),
    courseEnrollments: courseEnrollments.map((e) => ({
      programId: e.programId,
      programName: e.program.name,
      enrolledAt: e.enrolledAt,
      status: e.status,
      finalPrice: e.finalPrice,
    })),
    hasActiveMembership: memberships.some((ms) => ms.status === "active"),
    hasFrozenMembership: memberships.some((ms) => ms.status === "frozen"),
  };

  return (
    <div className="font-display">
      {/* Top bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <nav
          aria-label="Breadcrumb"
          className={`font-mono flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em] text-muted`}
        >
          <Link href="/app/members" className="text-brand hover:underline">
            {t.nav.members}
          </Link>
          <span className="text-line">/</span>
          <span>{member.memberNumber}</span>
        </nav>
        <Link
          href="/app/members"
          className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-brand transition-colors hover:border-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2.2} />
          {t.members.allMembers}
        </Link>
      </div>

      {pinSent && (
        <div className="animate-scale-in mb-5 rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-sm text-green-800 font-medium">
          {t.members.pinSentSuccess}
        </div>
      )}
      {(pinWaError || pinEmailError) && (
        <div className="animate-scale-in mb-5 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          {t.members.pinSentFailed}
          {pinWaError && ` WhatsApp: ${decodeURIComponent(pinWaError)}.`}
          {pinEmailError && ` Email: ${decodeURIComponent(pinEmailError)}.`}
        </div>
      )}
      {deleteError && (
        <div className="animate-scale-in mb-5 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          {decodeURIComponent(deleteError)}
        </div>
      )}
      {cancelPaymentError && (
        <div className="animate-scale-in mb-5 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          {decodeURIComponent(cancelPaymentError)}
        </div>
      )}

      <MemberProfileView
        data={data}
        t={t}
        dateFormat={dateFormat}
        editHref={`/app/members/${member.id}/edit`}
        onCancelPayment={session.role === "owner" ? handleCancelPayment : undefined}
      />

      {session.role === "owner" && (
        <section className="mt-5 rounded-[2rem] border border-red-200 bg-red-50 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">{t.members.dangerZone}</p>
          <p className="mt-2 text-sm text-red-700">{t.members.deleteMemberConfirm}</p>
          <form action={handleDelete} className="mt-4">
            <Button type="submit" variant="danger" icon={<Trash2 className="h-4 w-4" strokeWidth={2} />}>
              {t.members.deleteMember}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
