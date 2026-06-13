import { listMembers } from "@/lib/members";
import { listAllMemberships } from "@/lib/memberships";
import { listMembershipPlans } from "@/lib/membership-plans";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";

type SearchParams = { q?: string; ms?: string };

const membershipStatusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  frozen: "bg-blue-100 text-blue-700",
  expired: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-600",
  draft: "bg-yellow-100 text-yellow-700",
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

  const [allMembers, allMemberships, allPlans] = await Promise.all([
    listMembers(),
    listAllMemberships(),
    listMembershipPlans(),
  ]);

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
    { key: undefined, label: "All" },
    { key: "active", label: "Active membership" },
    { key: "frozen", label: "Frozen" },
    { key: "expiring", label: "Expiring soon" },
    { key: "none", label: "No membership" },
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
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.members}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {t.members.title}
          </h1>
        </div>
        <Link
          href="/app/members/new"
          className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
        >
          {t.members.newMember}
        </Link>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-line bg-surface px-5 py-4">
          <p className="text-3xl font-semibold">{allMembers.length}</p>
          <p className="mt-1 text-sm text-foreground/60">Total members</p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-surface px-5 py-4">
          <p className="text-3xl font-semibold text-green-600">
            {activeMembershipCount}
          </p>
          <p className="mt-1 text-sm text-foreground/60">Active memberships</p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-surface px-5 py-4">
          <p
            className={`text-3xl font-semibold ${expiringSoonCount > 0 ? "text-amber-600" : "text-foreground"}`}
          >
            {expiringSoonCount}
          </p>
          <p className="mt-1 text-sm text-foreground/60">Expiring in 30 days</p>
        </div>
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
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                isActive
                  ? activeColor
                  : "border border-line bg-white hover:border-brand hover:text-brand",
              ].join(" ")}
            >
              {tab.label}
            </a>
          );
        })}
      </section>

      {/* Result count */}
      <p className="text-sm text-foreground/60">
        {members.length} member{members.length !== 1 ? "s" : ""}
        {msFilter || q ? " matching filters" : " total"}
      </p>

      {/* Members list */}
      <section className="grid gap-3">
        {members.length === 0 && (
          <div className="rounded-[2rem] border border-line bg-surface px-6 py-10 text-center text-sm text-foreground/60">
            {t.members.noMembers}
          </div>
        )}
        {members.map((member) => {
          const primaryMs = membershipMap.get(member.id);
          const plan = primaryMs ? planMap.get(primaryMs.planId) : undefined;
          const avatar = initials(member.fullName);

          return (
            <article
              key={member.id}
              className="rounded-[1.75rem] border border-line bg-surface px-6 py-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                    {avatar}
                  </div>

                  <div>
                    {/* Name + number + member status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold tracking-tight">
                        {member.fullName}
                      </h2>
                      <span className="font-mono text-xs text-foreground/50">
                        {member.memberNumber}
                      </span>
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          member.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500",
                        ].join(" ")}
                      >
                        {member.status === "active"
                          ? t.status.active
                          : t.status.inactive}
                      </span>
                    </div>

                    {/* Phone */}
                    {member.phone && (
                      <p className="mt-0.5 text-sm text-foreground/55">
                        {member.phone}
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
                            {new Date(primaryMs.endDate).toLocaleDateString()}
                          </span>
                        )}
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 font-medium",
                            membershipStatusColors[primaryMs.status] ??
                              "bg-gray-100 text-gray-500",
                          ].join(" ")}
                        >
                          {t.status[
                            primaryMs.status as keyof typeof t.status
                          ] ?? primaryMs.status}
                        </span>
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
                  <Link
                    href={`/app/members/${member.id}`}
                    className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
                  >
                    {t.members.profile}
                  </Link>
                  <Link
                    href={`/app/members/${member.id}/edit`}
                    className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
                  >
                    {t.actions.edit}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
