import { listMembers, getMemberPhotoUrl } from "@/lib/members";
import { listAllMemberships } from "@/lib/memberships";
import { listMembershipPlans } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/date-format";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PhoneNumber } from "@/components/phone-number";
import type { BadgeTone } from "@/components/ui/badge";
import { UserPlus, Users, UserCheck, CalendarClock, PencilLine } from "lucide-react";

type SearchParams = { q?: string; ms?: string };

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
  const { q, ms } = await searchParams;

  const [allMembers, allMemberships, allPlans, settings] = await Promise.all([
    listMembers(),
    listAllMemberships(),
    listMembershipPlans(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const planMap = new Map(allPlans.map((p) => [p.id, p]));

  // Pick the single most-relevant membership per member
  const membershipMap = new Map<string, (typeof allMemberships)[0]>();
  for (const ms of allMemberships) {
    const existing = membershipMap.get(ms.memberId);
    const cur = membershipPriority[ms.status] ?? 0;
    const prev = existing ? (membershipPriority[existing.status] ?? 0) : -1;
    if (cur > prev) membershipMap.set(ms.memberId, ms);
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

  const msFilter = ms;
  if (msFilter === "active") {
    members = members.filter(
      (m) => membershipMap.get(m.id)?.status === "active",
    );
  } else if (msFilter === "frozen") {
    members = members.filter(
      (m) => membershipMap.get(m.id)?.status === "frozen",
    );
  } else if (msFilter === "expiring") {
    members = members.filter((m) => {
      const membership = membershipMap.get(m.id);
      return (
        membership?.status === "active" &&
        membership.endDate >= todayStr &&
        membership.endDate <= thirtyDaysStr
      );
    });
  } else if (msFilter === "none") {
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

  function filterUrl(newMs?: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (newMs) params.set("ms", newMs);
    const qs = params.toString();
    return `/app/members${qs ? `?${qs}` : ""}`;
  }

  const tabs = [
    { key: undefined, label: t.members.filterAll },
    { key: "active", label: t.members.filterActiveMembership },
    { key: "frozen", label: t.members.filterFrozen },
    { key: "expiring", label: t.members.filterExpiringSoon },
    { key: "none", label: t.members.filterNoMembership },
  ] as const;

  const tabColors: Record<string, string> = {
    active: "bg-green-600 text-white",
    frozen: "bg-blue-600 text-white",
    expiring: "bg-amber-500 text-white",
    none: "bg-gray-600 text-white",
  };

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
          value={<span className="text-green-600">{activeMembershipCount}</span>}
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

      {/* Filter tabs */}
      <section className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = msFilter === tab.key;
          const activeColor = tab.key ? tabColors[tab.key] : "bg-brand text-white";
          return (
            <a
              key={tab.key ?? "all"}
              href={filterUrl(tab.key)}
              className={[
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? `${activeColor} shadow-sm`
                  : "border border-line bg-white hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm",
              ].join(" ")}
            >
              {tab.label}
            </a>
          );
        })}
      </section>

      {/* Result count */}
      <p className="text-sm text-foreground/60">
        {members.length}{" "}
        {members.length !== 1
          ? t.members.memberCountPlural
          : t.members.memberCountSingular}{" "}
        {msFilter || q ? t.members.matchingFilters : t.members.total}
      </p>

      {/* Members list */}
      <section className="grid gap-3">
        {members.length === 0 && (
          <EmptyState icon={<Users className="h-5 w-5" strokeWidth={2} />} title={t.members.noMembers} />
        )}
        {members.map((member, index) => {
          const primaryMs = membershipMap.get(member.id);
          const plan = primaryMs ? planMap.get(primaryMs.planId) : undefined;
          const avatar = initials(member.fullName);
          const photoUrl = getMemberPhotoUrl(member.pictureUrl);

          return (
            <Card
              key={member.id}
              hoverable
              animate
              delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-brand/10"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/20 to-brand/5 text-sm font-semibold text-brand ring-1 ring-brand/10">
                      {avatar}
                    </div>
                  )}

                  <div>
                    {/* Name + number + member status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold tracking-tight">
                        {member.fullName}
                      </h2>
                      <span className="font-mono text-xs text-foreground/50">
                        {member.memberNumber}
                      </span>
                      <Badge tone={member.status === "active" ? "success" : "neutral"}>
                        {member.status === "active" ? t.status.active : t.status.inactive}
                      </Badge>
                    </div>

                    {/* Phone */}
                    {member.phone && (
                      <p className="mt-0.5 text-sm text-foreground/55">
                        <PhoneNumber value={member.phone} />
                      </p>
                    )}

                    {/* Membership info */}
                    {primaryMs ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-foreground/60">
                          {plan?.name ?? "Membership"}
                        </span>
                        {primaryMs.endDate && (
                          <span className="text-foreground/40">
                            · expires{" "}
                            {formatDate(primaryMs.endDate, dateFormat)}
                          </span>
                        )}
                        <Badge tone={membershipTone[primaryMs.status] ?? "neutral"}>
                          {t.status[primaryMs.status as keyof typeof t.status] ?? primaryMs.status}
                        </Badge>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-foreground/40">
                        No membership
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:shrink-0">
                  <Button href={`/app/members/${member.id}`} variant="secondary" size="sm">
                    {t.members.profile}
                  </Button>
                  <Button
                    href={`/app/members/${member.id}/edit`}
                    variant="secondary"
                    size="sm"
                    icon={<PencilLine className="h-3.5 w-3.5" strokeWidth={2} />}
                  >
                    {t.actions.edit}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
