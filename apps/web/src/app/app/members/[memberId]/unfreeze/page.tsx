"use server";

import { getMember } from "@/lib/members";
import { listMembershipsForMember, unfreezeMembership } from "@/lib/memberships";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/date-format";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle } from "lucide-react";

type Props = { params: Promise<{ memberId: string }> };

export default async function UnfreezeMembershipPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships, settings] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const frozenMembership = memberships.find((ms) => ms.status === "frozen") ?? null;

  async function handleUnfreeze() {
    "use server";
    if (!frozenMembership) return;

    await unfreezeMembership(frozenMembership.id);
    redirect(`/app/members/${memberId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.members}
        title={`${t.memberships.unfreeze} — ${member.fullName}`}
        description={member.memberNumber}
      />

      {!frozenMembership && (
        <section className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm">
          <p className="font-medium text-yellow-800">{t.memberships.noFrozenMembership}</p>
          <p className="mt-1 text-yellow-700">
            This member has no frozen membership to unfreeze.
          </p>
        </section>
      )}

      {frozenMembership && (
        <>
          <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm">
            <p className="font-medium text-blue-800">{t.status.frozen}</p>
            <p className="mt-1 text-blue-700">
              Re-activating this membership will allow the member to check in again.
              The extended end date set during the freeze will be preserved.
            </p>
          </section>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
              {t.memberships.frozenMembership}
            </p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-foreground/55">{t.memberships.plan}</dt>
                <dd className="mt-0.5 font-medium">
                  {frozenMembership.plan?.name ?? frozenMembership.planId}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/55">{t.memberships.period}</dt>
                <dd className="mt-0.5 font-medium">
                  {formatDate(frozenMembership.startDate, dateFormat)} → {formatDate(frozenMembership.endDate, dateFormat)}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/55">{t.members.statusLabel}</dt>
                <dd className="mt-0.5">
                  <Badge tone="info">{t.status.frozen}</Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
            <p className="text-sm font-medium">{t.memberships.confirmReactivation}</p>
            <p className="mt-1 text-sm text-foreground/55">
              The membership will be set back to <strong>{t.status.active}</strong>. The member can check in
              immediately after this action.
            </p>
            <form action={handleUnfreeze} className="mt-5 flex gap-3">
              <Button type="submit" variant="primary" icon={<PlayCircle className="h-4 w-4" strokeWidth={2} />}>
                {t.memberships.reactivateMembership}
              </Button>
              <Button href={`/app/members/${memberId}`} variant="secondary">
                {t.actions.cancel}
              </Button>
            </form>
          </section>
        </>
      )}

      {!frozenMembership && (
        <div className="flex">
          <Button href={`/app/members/${memberId}`} variant="secondary">
            {t.memberships.backToProfile}
          </Button>
        </div>
      )}
    </div>
  );
}
