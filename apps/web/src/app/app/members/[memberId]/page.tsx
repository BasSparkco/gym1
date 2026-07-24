import { getMember, getMemberPhotoUrl } from "@/lib/members";
import { listMembershipsForMember } from "@/lib/memberships";
import { listPaymentsForMember } from "@/lib/payments";
import { listLockerRentalsForMember } from "@/lib/lockers";
import { listEnrollmentsForMember } from "@/lib/training-programs";
import { listBranches } from "@/lib/branches";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";
import Link from "next/link";
import { computeAge, computeBmi, initials } from "@/components/members/member-profile-shared";
import { MemberProfileView, type MemberProfileData } from "@/components/members/member-profile-view";
import { ArrowLeft } from "lucide-react";

type Props = { params: Promise<{ memberId: string }> };

export default async function MemberProfilePage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships, payments, lockerRentals, courseEnrollments, branches, employees, settings] =
    await Promise.all([
      getMember(memberId),
      listMembershipsForMember(memberId),
      listPaymentsForMember(memberId),
      listLockerRentalsForMember(memberId),
      listEnrollmentsForMember(memberId),
      listBranches(),
      listEmployees(),
      getSettings(),
    ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const homeBranch = branches.find((b) => b.id === member.homeBranchId);
  const currencySymbol = getCurrencySymbol(homeBranch?.operatingCurrencyCode);
  const registeredEmployee = employees.find((e) => e.id === member.registeredEmployeeId);

  const data: MemberProfileData = {
    member,
    avatar: initials(member.fullName),
    photoUrl: getMemberPhotoUrl(member.pictureUrl),
    branchName: homeBranch?.name ?? "—",
    currencySymbol,
    registeredEmployeeName: registeredEmployee?.fullName,
    age: computeAge(member.dateOfBirth),
    bmi: computeBmi(member.height, member.weight),
    memberships: memberships
      .slice()
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((ms) => ({
        id: ms.id,
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
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
          {t.members.allMembers}
        </Link>
      </div>

      <MemberProfileView data={data} t={t} dateFormat={dateFormat} editHref={`/app/members/${member.id}/edit`} />
    </div>
  );
}
