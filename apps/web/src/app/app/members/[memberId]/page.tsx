import { getMember } from "@/lib/members";
import { listMembershipsForMember } from "@/lib/memberships";
import { listPaymentsForMember } from "@/lib/payments";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";

type Props = { params: Promise<{ memberId: string }> };

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    frozen: "bg-blue-100 text-blue-700",
    expired: "bg-gray-100 text-gray-500",
    cancelled: "bg-red-100 text-red-600",
    draft: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-600",
    refunded: "bg-purple-100 text-purple-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
};

export default async function MemberProfilePage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships, payments, branches] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
    listPaymentsForMember(memberId),
    listBranches(),
  ]);

  const homeBranch = branches.find((b) => b.id === member.homeBranchId);

  const activeMembership = memberships.find((ms) => ms.status === "active");
  const frozenMembership = memberships.find((ms) => ms.status === "frozen");

  const statusLabel = (status: string): string => {
    const map: Record<string, string> = {
      active: t.status.active,
      inactive: t.status.inactive,
      frozen: t.status.frozen,
      expired: t.status.expired,
      cancelled: t.status.cancelled,
      draft: t.status.draft,
      paid: t.status.paid,
      pending: t.status.pending,
      failed: t.status.failed,
      refunded: t.status.refunded,
    };
    return map[status] ?? status;
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.members}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{member.fullName}</h1>
            <span className="text-lg text-foreground/50">{member.memberNumber}</span>
            <span
              className={[
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                member.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500",
              ].join(" ")}
            >
              {statusLabel(member.status)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/app/members/${member.id}/edit`}
            className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            {t.actions.edit}
          </Link>
          <Link
            href="/app/members"
            className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            {t.members.allMembers}
          </Link>
        </div>
      </section>

      {/* Profile + Emergency contact */}
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">{t.members.profile}</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.members.fullName}</dt>
              <dd className="mt-0.5 font-medium">{member.fullName}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.members.memberNumber}</dt>
              <dd className="mt-0.5 font-mono font-medium">{member.memberNumber}</dd>
            </div>
            {member.phone && (
              <div>
                <dt className="text-foreground/55">{t.members.phone}</dt>
                <dd className="mt-0.5 font-medium">{member.phone}</dd>
              </div>
            )}
            {member.email && (
              <div>
                <dt className="text-foreground/55">{t.members.email}</dt>
                <dd className="mt-0.5 font-medium">{member.email}</dd>
              </div>
            )}
            {member.dateOfBirth && (
              <div>
                <dt className="text-foreground/55">{t.members.dateOfBirth}</dt>
                <dd className="mt-0.5 font-medium">{member.dateOfBirth}</dd>
              </div>
            )}
            <div>
              <dt className="text-foreground/55">{t.members.homeBranch}</dt>
              <dd className="mt-0.5 font-medium">
                {homeBranch ? (
                  <Link
                    href={`/app/branches/${homeBranch.id}`}
                    className="text-brand hover:underline"
                  >
                    {homeBranch.name}
                  </Link>
                ) : (
                  <span className="text-foreground/40">{member.homeBranchId}</span>
                )}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t.members.emergencyContact}</p>
          <dl className="mt-4 grid gap-3 text-sm">
            {member.emergencyContactName || member.emergencyContactPhone ? (
              <>
                {member.emergencyContactName && (
                  <div>
                    <dt className="text-foreground/55">{t.members.contactName}</dt>
                    <dd className="mt-0.5 font-medium">{member.emergencyContactName}</dd>
                  </div>
                )}
                {member.emergencyContactPhone && (
                  <div>
                    <dt className="text-foreground/55">{t.members.phone}</dt>
                    <dd className="mt-0.5 font-medium">{member.emergencyContactPhone}</dd>
                  </div>
                )}
              </>
            ) : (
              <p className="text-foreground/40 text-xs">No emergency contact recorded.</p>
            )}
          </dl>

          {member.medicalNotes && (
            <>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">{t.members.medicalNotes}</p>
              <p className="mt-2 text-sm leading-6 text-foreground/70">{member.medicalNotes}</p>
            </>
          )}
        </article>
      </section>

      {/* Quick actions */}
      <section className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t.members.quickActions}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            href={`/app/members/${member.id}/edit`}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            {t.members.editDetails}
          </Link>
          {activeMembership ? (
            <Link
              href={`/app/members/${member.id}/payments/new`}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              {t.members.recordPayment}
            </Link>
          ) : (
            <Link
              href={`/app/members/${member.id}/memberships/new`}
              className="rounded-2xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-medium text-brand transition hover:bg-brand/10"
            >
              {t.members.sellMembership}
            </Link>
          )}
          <Link
            href={`/app/members/${member.id}/renew`}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            {t.members.renewMembership}
          </Link>
          {activeMembership && (
            <Link
              href={`/app/members/${member.id}/freeze`}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              {t.members.freezeMembership}
            </Link>
          )}
          {frozenMembership && (
            <Link
              href={`/app/members/${member.id}/unfreeze`}
              className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
            >
              {t.members.reactivateMembership}
            </Link>
          )}
        </div>
      </section>

      {/* Memberships */}
      <section className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">{t.members.memberships}</p>
          <Link
            href={`/app/members/${member.id}/memberships/new`}
            className="text-xs font-medium text-brand hover:underline"
          >
            + {t.members.sellMembership}
          </Link>
        </div>

        {memberships.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/40">No memberships yet.</p>
        ) : (
          <div className="mt-4 grid gap-2">
            {memberships
              .slice()
              .sort((a, b) => b.startDate.localeCompare(a.startDate))
              .map((ms) => (
                <div
                  key={ms.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <span className="font-medium">{ms.plan?.name ?? ms.planId}</span>
                    <span className="ml-2 text-foreground/50">
                      {ms.startDate} → {ms.endDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-foreground/70">${ms.finalPrice}</span>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        statusBadge(ms.status),
                      ].join(" ")}
                    >
                      {statusLabel(ms.status)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Payments */}
      <section className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">{t.members.payments}</p>
          <Link
            href={`/app/members/${member.id}/payments/new`}
            className="text-xs font-medium text-brand hover:underline"
          >
            + {t.members.recordPayment}
          </Link>
        </div>

        {payments.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/40">{t.payments.noPayments}</p>
        ) : (
          <div className="mt-4 grid gap-2">
            {payments
              .slice()
              .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
              .map((pmt) => (
                <div
                  key={pmt.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <span className="font-mono font-medium">${pmt.amount}</span>
                    <span className="ml-2 text-foreground/50 capitalize">{pmt.paymentMethod}</span>
                    <span className="ml-2 text-foreground/40 text-xs">
                      {new Date(pmt.paymentDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      statusBadge(pmt.status),
                    ].join(" ")}
                  >
                    {statusLabel(pmt.status)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
