import { listMembers, getMemberPhotoUrl } from "@/lib/members";
import { listAllMemberships } from "@/lib/memberships";
import { listPaymentsForMember } from "@/lib/payments";
import { listLockerRentalsForMember } from "@/lib/lockers";
import { listEnrollmentsForMember } from "@/lib/training-programs";
import { listMembershipPlans } from "@/lib/membership-plans";
import { listBranches } from "@/lib/branches";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";
import { formatDate } from "@/lib/date-format";
import { computeAge, computeBmi, initials } from "@/components/members/member-profile-shared";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MembersTableBody, type MemberRow } from "@/components/members/members-table-body";
import { MembersFilterToolbar } from "@/components/members/members-filter-toolbar";
import type { BadgeTone } from "@/components/ui/badge";
import { UserPlus, Users, UserCheck, CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { Suspense } from "react";

type SearchParams = {
  q?: string;
  ms?: string;
  branch?: string;
  plan?: string;
  page?: string;
};

const PAGE_SIZE = 10;

const membershipTone: Record<string, BadgeTone> = {
  active: "success",
  frozen: "info",
  expired: "neutral",
  cancelled: "danger",
  draft: "warning",
};

const membershipPriority: Record<string, number> = {
  active: 5,
  frozen: 4,
  expired: 3,
  draft: 2,
  cancelled: 1,
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const t = await getT();
  const { q, ms, branch: branchFilter, plan: planFilter, page: pageParam } = await searchParams;

  const [allMembers, allMemberships, allPlans, branches, employees, settings] = await Promise.all([
    listMembers(),
    listAllMemberships(),
    listMembershipPlans(),
    listBranches(),
    listEmployees(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";
  const viewingAllBranches = session.role === "owner" && settings.ownerDataScope === "all";

  const planMap = new Map(allPlans.map((p) => [p.id, p]));
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  // Pick the single most-relevant membership per member
  const membershipMap = new Map<string, (typeof allMemberships)[0]>();
  for (const m of allMemberships) {
    const existing = membershipMap.get(m.memberId);
    const cur = membershipPriority[m.status] ?? 0;
    const prev = existing ? (membershipPriority[existing.status] ?? 0) : -1;
    if (cur > prev) membershipMap.set(m.memberId, m);
  }

  // Stats
  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysStr = new Date(Date.now() + 30 * 86_400_000)
    .toISOString()
    .split("T")[0];
  const activeMembershipCount = allMemberships.filter(
    (m) => m.status === "active",
  ).length;
  const expiringSoonCount = allMemberships.filter(
    (m) =>
      m.status === "active" &&
      m.endDate >= todayStr &&
      m.endDate <= thirtyDaysStr,
  ).length;

  // Apply filters
  let members = allMembers;

  if (q) {
    const lq = q.toLowerCase();
    members = members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(lq) ||
        m.memberNumber.toLowerCase().includes(lq) ||
        (m.phone ?? "").includes(lq),
    );
  }

  if (branchFilter) {
    members = members.filter((m) => m.homeBranchId === branchFilter);
  }

  if (planFilter) {
    members = members.filter((m) => membershipMap.get(m.id)?.planId === planFilter);
  }

  if (ms === "active") {
    members = members.filter(
      (m) => membershipMap.get(m.id)?.status === "active",
    );
  } else if (ms === "frozen") {
    members = members.filter(
      (m) => membershipMap.get(m.id)?.status === "frozen",
    );
  } else if (ms === "expiring") {
    members = members.filter((m) => {
      const membership = membershipMap.get(m.id);
      return (
        membership?.status === "active" &&
        membership.endDate >= todayStr &&
        membership.endDate <= thirtyDaysStr
      );
    });
  } else if (ms === "none") {
    members = members.filter((m) => {
      const membership = membershipMap.get(m.id);
      return (
        !membership ||
        membership.status === "expired" ||
        membership.status === "cancelled" ||
        membership.status === "draft"
      );
    });
  }

  // Pagination
  const total = members.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageMembers = members.slice(startIdx, startIdx + PAGE_SIZE);

  const pagePayments = await Promise.all(pageMembers.map((m) => listPaymentsForMember(m.id)));
  const pageLockerRentals = await Promise.all(pageMembers.map((m) => listLockerRentalsForMember(m.id)));
  const pageCourseEnrollments = await Promise.all(pageMembers.map((m) => listEnrollmentsForMember(m.id)));

  const rows: MemberRow[] = pageMembers.map((member, i) => {
    const primaryMs = membershipMap.get(member.id);
    const plan = primaryMs ? planMap.get(primaryMs.planId) : undefined;
    const homeBranch = branches.find((b) => b.id === member.homeBranchId);
    const registeredEmployee = employees.find((e) => e.id === member.registeredEmployeeId);
    const memberMemberships = allMemberships
      .filter((ms) => ms.memberId === member.id)
      .slice()
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((ms) => ({
        id: ms.id,
        planName: planMap.get(ms.planId)?.name ?? ms.planId,
        startDate: ms.startDate,
        endDate: ms.endDate,
        status: ms.status,
        finalPrice: ms.finalPrice,
      }));

    const statusTone: BadgeTone = primaryMs
      ? (membershipTone[primaryMs.status] ?? "neutral")
      : member.status === "active"
        ? "success"
        : "neutral";
    const statusLabelText = primaryMs
      ? (t.status[primaryMs.status as keyof typeof t.status] ?? primaryMs.status)
      : member.status === "active"
        ? t.status.active
        : t.status.inactive;
    const isExpired = primaryMs?.status === "expired";
    const isExpiringSoon =
      primaryMs?.status === "active" &&
      primaryMs.endDate >= todayStr &&
      primaryMs.endDate <= thirtyDaysStr;
    const expiryColorClass = isExpired ? "text-danger" : isExpiringSoon ? "text-amber-600" : "text-foreground/70";

    return {
      member,
      avatar: initials(member.fullName),
      photoUrl: getMemberPhotoUrl(member.pictureUrl),
      planBadge: plan?.name,
      branchName: branchMap.get(member.homeBranchId) ?? "—",
      expiresText: primaryMs ? formatDate(primaryMs.endDate, dateFormat) : "—",
      expiryColorClass,
      statusTone,
      statusLabelText,
      currencySymbol: getCurrencySymbol(homeBranch?.operatingCurrencyCode),
      registeredEmployeeName: registeredEmployee?.fullName,
      age: computeAge(member.dateOfBirth),
      bmi: computeBmi(member.height, member.weight),
      memberships: memberMemberships,
      payments: pagePayments[i].map((p) => ({
        id: p.id,
        amount: p.amount,
        paymentDate: p.paymentDate,
        status: p.status,
        paymentMethod: p.paymentMethod,
      })),
      lockerRentals: pageLockerRentals[i].map((r) => ({
        id: r.id,
        lockerNumber: r.locker?.lockerNumber ?? r.lockerId,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status,
        finalPrice: r.finalPrice,
      })),
      courseEnrollments: pageCourseEnrollments[i].map((e) => ({
        programId: e.programId,
        programName: e.program.name,
        enrolledAt: e.enrolledAt,
        status: e.status,
        finalPrice: e.finalPrice,
      })),
      hasActiveMembership: memberMemberships.some((ms) => ms.status === "active"),
      hasFrozenMembership: memberMemberships.some((ms) => ms.status === "frozen"),
    };
  });

  function pageUrl(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (ms) params.set("ms", ms);
    if (branchFilter) params.set("branch", branchFilter);
    if (planFilter) params.set("plan", planFilter);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return `/app/members${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <PageHeader
        eyebrow={t.nav.members}
        title={t.members.title}
        actions={
          <Button href="/app/members/new" variant="primary" icon={<UserPlus className="h-4 w-4" strokeWidth={2} />}>
            {t.members.newMember}
          </Button>
        }
      />

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-4 w-4" strokeWidth={2} />}
          label={t.members.totalMembers}
          value={allMembers.length}
          delay={1}
        />
        <StatCard
          icon={<UserCheck className="h-4 w-4" strokeWidth={2} />}
          label={t.members.activeMemberships}
          value={<span className="text-accent-strong">{activeMembershipCount}</span>}
          delay={2}
        />
        <StatCard
          icon={<CalendarClock className="h-4 w-4" strokeWidth={2} />}
          label={t.members.expiringIn30Days}
          value={
            <span className={expiringSoonCount > 0 ? "text-amber-600" : "text-foreground"}>
              {expiringSoonCount}
            </span>
          }
          delay={3}
        />
      </section>

      {/* Filter toolbar */}
      <Suspense fallback={null}>
        <MembersFilterToolbar branches={branches} plans={allPlans} t={t} showBranchFilter={viewingAllBranches} />
      </Suspense>

      {/* Result count */}
      <p className="text-sm text-foreground/60">
        {total}{" "}
        {total !== 1 ? t.members.memberCountPlural : t.members.memberCountSingular}{" "}
        {ms || q || branchFilter || planFilter ? t.members.matchingFilters : t.members.total}
      </p>

      {/* Members table */}
      {total === 0 ? (
        <EmptyState icon={<Users className="h-5 w-5" strokeWidth={2} />} title={t.members.noMembers} />
      ) : (
        <Card animate delay={1} className="min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-start text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pe-4 text-start">{t.reports.memberCol}</th>
                  <th className="pb-3 pe-4 text-start">{t.reports.planCol}</th>
                  {viewingAllBranches && <th className="pb-3 pe-4 text-start">{t.members.homeBranch}</th>}
                  <th className="pb-3 pe-4 text-start">{t.reports.expiresCol}</th>
                  <th className="pb-3 pe-4 text-start">{t.reports.statusCol}</th>
                  <th className="pb-3 pe-4 text-start">{t.members.debt}</th>
                  <th className="pb-3 text-end">{t.actions.details}</th>
                </tr>
              </thead>
              <MembersTableBody
                rows={rows}
                branches={branches}
                employees={employees}
                dateFormat={dateFormat}
                t={t}
                showBranchColumn={viewingAllBranches}
              />
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-foreground/50">
              {formatDict(t.members.showingResults, {
                from: startIdx + 1,
                to: Math.min(startIdx + PAGE_SIZE, total),
                total,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                href={pageUrl(Math.max(1, currentPage - 1))}
                variant="secondary"
                size="sm"
                icon={<ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />}
                className={currentPage <= 1 ? "pointer-events-none opacity-40" : ""}
              >
                {t.actions.prev}
              </Button>
              <Button
                href={pageUrl(Math.min(totalPages, currentPage + 1))}
                variant="secondary"
                size="sm"
                trailingIcon={<ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />}
                className={currentPage >= totalPages ? "pointer-events-none opacity-40" : ""}
              >
                {t.actions.next}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
