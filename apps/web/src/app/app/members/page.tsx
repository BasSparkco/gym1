import { listMembers, getMemberPhotoUrl } from "@/lib/members";
import { listAllMemberships } from "@/lib/memberships";
import { listMembershipPlans } from "@/lib/membership-plans";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/date-format";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import type { BadgeTone } from "@/components/ui/badge";
import { UserPlus, Users, UserCheck, CalendarClock, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

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

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireSession();
  const t = await getT();
  const { q, ms, branch: branchFilter, plan: planFilter, page: pageParam } = await searchParams;

  const [allMembers, allMemberships, allPlans, branches, settings] = await Promise.all([
    listMembers(),
    listAllMemberships(),
    listMembershipPlans(),
    listBranches(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

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
      <form className="flex flex-wrap items-end gap-3 rounded-[18px] border border-line bg-surface px-6 py-5">
        <label className="grid flex-1 gap-1 text-sm" style={{ minWidth: 220 }}>
          <span className="text-xs font-medium text-foreground/60">{t.members.searchPlaceholder}</span>
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" strokeWidth={2} />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder={t.members.searchPlaceholder}
              className="w-full rounded-[10px] border border-line bg-white py-2 ps-9 pe-4 text-sm outline-none focus:border-brand"
            />
          </div>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-foreground/60">{t.members.homeBranch}</span>
          <select
            name="branch"
            defaultValue={branchFilter ?? ""}
            className="rounded-[10px] border border-line bg-white px-4 py-2 text-sm"
          >
            <option value="">{t.employees.filterAllBranches}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-foreground/60">{t.reports.planCol}</span>
          <select
            name="plan"
            defaultValue={planFilter ?? ""}
            className="rounded-[10px] border border-line bg-white px-4 py-2 text-sm"
          >
            <option value="">{t.members.filterAllPlans}</option>
            {allPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-foreground/60">{t.members.statusLabel}</span>
          <select
            name="ms"
            defaultValue={ms ?? ""}
            className="rounded-[10px] border border-line bg-white px-4 py-2 text-sm"
          >
            <option value="">{t.members.filterAll}</option>
            <option value="active">{t.members.filterActiveMembership}</option>
            <option value="frozen">{t.members.filterFrozen}</option>
            <option value="expiring">{t.members.filterExpiringSoon}</option>
            <option value="none">{t.members.filterNoMembership}</option>
          </select>
        </label>
        <Button type="submit" variant="primary" size="md" icon={<Filter className="h-4 w-4" strokeWidth={2} />}>
          {t.reports.applyFilter}
        </Button>
      </form>

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
                  <th className="pb-3 pe-4 text-start">{t.members.homeBranch}</th>
                  <th className="pb-3 pe-4 text-start">{t.reports.expiresCol}</th>
                  <th className="pb-3 pe-4 text-start">{t.reports.statusCol}</th>
                  <th className="pb-3 text-end">{t.actions.details}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageMembers.map((member) => {
                  const primaryMs = membershipMap.get(member.id);
                  const plan = primaryMs ? planMap.get(primaryMs.planId) : undefined;
                  const avatar = initials(member.fullName);
                  const photoUrl = getMemberPhotoUrl(member.pictureUrl);
                  const statusTone: BadgeTone = primaryMs
                    ? (membershipTone[primaryMs.status] ?? "neutral")
                    : member.status === "active"
                      ? "success"
                      : "neutral";
                  const statusLabel = primaryMs
                    ? (t.status[primaryMs.status as keyof typeof t.status] ?? primaryMs.status)
                    : member.status === "active"
                      ? t.status.active
                      : t.status.inactive;
                  const isExpired = primaryMs?.status === "expired";
                  const isExpiringSoon =
                    primaryMs?.status === "active" &&
                    primaryMs.endDate >= todayStr &&
                    primaryMs.endDate <= thirtyDaysStr;
                  const expiryColor = isExpired
                    ? "text-danger"
                    : isExpiringSoon
                      ? "text-amber-600"
                      : "text-foreground/70";

                  return (
                    <tr key={member.id} className="transition-colors hover:bg-black/[0.02]">
                      <td className="py-3 pe-4 text-start">
                        <Link href={`/app/members/${member.id}`} className="flex items-center gap-3">
                          {photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrl}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-brand/10"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/20 to-brand/5 text-xs font-semibold text-brand ring-1 ring-brand/10">
                              {avatar}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold tracking-tight hover:text-brand hover:underline">
                              {member.fullName}
                            </p>
                            <p className="font-mono text-xs text-foreground/50">{member.memberNumber}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 pe-4 text-start">
                        {plan ? (
                          <Badge tone="brand">{plan.name}</Badge>
                        ) : (
                          <span className="text-xs text-foreground/40">{t.members.noMembershipsYet}</span>
                        )}
                      </td>
                      <td className="py-3 pe-4 text-start text-foreground/70">
                        {branchMap.get(member.homeBranchId) ?? "—"}
                      </td>
                      <td className={`py-3 pe-4 text-start font-mono text-xs ${expiryColor}`}>
                        {primaryMs ? formatDate(primaryMs.endDate, dateFormat) : "—"}
                      </td>
                      <td className="py-3 pe-4 text-start">
                        <Badge tone={statusTone}>{statusLabel}</Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button href={`/app/members/${member.id}`} variant="secondary" size="sm">
                            {t.members.profile}
                          </Button>
                          <Button href={`/app/members/${member.id}/edit`} variant="secondary" size="sm">
                            {t.actions.edit}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
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
