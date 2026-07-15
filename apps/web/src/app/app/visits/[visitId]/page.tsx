"use server";

import { getVisit, checkOutVisit } from "@/lib/visits";
import { getMember } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/date-format";
import { revalidatePath } from "next/cache";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, LogOut } from "lucide-react";

type Props = { params: Promise<{ visitId: string }> };

export default async function VisitDetailPage({ params }: Props) {
  const { visitId } = await params;
  await requireSession();
  const t = await getT();

  const [visit, settings] = await Promise.all([getVisit(visitId), getSettings()]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  let member = null;
  try {
    member = await getMember(visit.memberId);
  } catch {
    // member may be out of scope; render with available data
  }

  async function handleCheckOut() {
    "use server";
    await checkOutVisit(visitId);
    revalidatePath(`/app/visits/${visitId}`);
  }

  const localCheckInTime = formatDateTime(visit.checkInTime, dateFormat);
  const localCheckOutTime = visit.checkOutTime
    ? formatDateTime(visit.checkOutTime, dateFormat)
    : null;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.visits}
        title={t.visits.visitDetail}
        description={<span className="font-mono text-xs text-foreground/50">{visit.id}</span>}
        actions={
          <Button href="/app/visits" variant="secondary" icon={<History className="h-4 w-4" strokeWidth={2} />}>
            {t.visits.allVisits}
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card animate delay={1}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">{t.visits.visitInfo}</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.visits.checkInTime}</dt>
              <dd className="mt-0.5 font-medium">{localCheckInTime}</dd>
            </div>
            {settings.checkOutTrackingEnabled && (
            <div>
              <dt className="text-foreground/55">{t.visits.checkOutTime}</dt>
              <dd className="mt-0.5">
                {localCheckOutTime ? (
                  <span className="font-medium">{localCheckOutTime}</span>
                ) : (
                  <form action={handleCheckOut}>
                    <Button type="submit" variant="primary" size="sm" icon={<LogOut className="h-3.5 w-3.5" strokeWidth={2} />}>
                      {t.visits.checkOut}
                    </Button>
                  </form>
                )}
              </dd>
            </div>
            )}
            <div>
              <dt className="text-foreground/55">{t.visits.accessMethod}</dt>
              <dd className="mt-0.5">
                {visit.accessMethod === "rfid" ? (
                  <Badge tone="neutral" className="!bg-violet-100 !text-violet-700">
                    RFID
                  </Badge>
                ) : (
                  <Badge tone={visit.accessMethod === "qr" ? "info" : "neutral"}>
                    {visit.accessMethod === "qr" ? t.visits.qrScan : t.visits.manualEntry}
                  </Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.visits.branch}</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground/70">{visit.branchId}</dd>
            </div>
          </dl>
        </Card>

        <Card animate delay={2}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t.visits.member}</p>
          {member ? (
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-foreground/55">{t.members.fullName}</dt>
                <dd className="mt-0.5 font-medium">{member.fullName}</dd>
              </div>
              <div>
                <dt className="text-foreground/55">{t.members.memberNumber}</dt>
                <dd className="mt-0.5 font-mono font-medium">{member.memberNumber}</dd>
              </div>
              <div>
                <dt className="text-foreground/55">{t.members.statusLabel}</dt>
                <dd className="mt-0.5">
                  <Badge tone={member.status === "active" ? "success" : "neutral"}>
                    {member.status === "active" ? t.status.active : t.status.inactive}
                  </Badge>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 font-mono text-xs text-foreground/50">{visit.memberId}</p>
          )}
          {member && (
            <div className="mt-4">
              <Button href={`/app/members/${member.id}`} variant="secondary" size="sm">
                {t.visits.viewMemberProfile}
              </Button>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
