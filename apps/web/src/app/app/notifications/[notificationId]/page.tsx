import { getNotification } from "@/lib/notifications";
import { getMember } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/date-format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BadgeTone } from "@/components/ui/badge";
import { Bell } from "lucide-react";

type Props = { params: Promise<{ notificationId: string }> };

const channelLabel: Record<string, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  email: "Email",
  app: "Mobile app",
};

const channelTone: Record<string, BadgeTone> = {
  sms: "info",
  whatsapp: "success",
  email: "brand",
  app: "accent",
};

const statusTone: Record<string, BadgeTone> = {
  sent: "success",
  pending: "warning",
  failed: "danger",
};

export default async function NotificationDetailPage({ params }: Props) {
  const { notificationId } = await params;
  await requireSession();
  const t = await getT();

  const [notif, settings] = await Promise.all([getNotification(notificationId), getSettings()]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  let member = null;
  try {
    member = await getMember(notif.memberId);
  } catch {
    // member may be out of scope
  }

  const createdAt = formatDateTime(notif.createdAt, dateFormat);
  const sentAt = notif.sentAt ? formatDateTime(notif.sentAt, dateFormat) : null;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.notifications}
        title={t.notifications.notificationDetail}
        description={<span className="font-mono text-xs text-foreground/50">{notif.id}</span>}
        actions={
          <Button href="/app/notifications" variant="secondary" icon={<Bell className="h-4 w-4" strokeWidth={2} />}>
            {t.notifications.allNotifications}
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card animate delay={1}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.notifications.notificationInfo}
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.notifications.subject}</dt>
              <dd className="mt-0.5 font-medium">{notif.subject}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.notifications.body}</dt>
              <dd className="mt-0.5 text-foreground/80">{notif.body}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.notifications.channel}</dt>
              <dd className="mt-0.5">
                <Badge tone={channelTone[notif.channel] ?? "neutral"}>
                  {channelLabel[notif.channel] ?? notif.channel}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.notifications.statusLabel}</dt>
              <dd className="mt-0.5">
                <Badge tone={statusTone[notif.status] ?? "neutral"}>
                  {notif.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.notifications.created}</dt>
              <dd className="mt-0.5 font-medium">{createdAt}</dd>
            </div>
            {sentAt && (
              <div>
                <dt className="text-foreground/55">{t.notifications.sent}</dt>
                <dd className="mt-0.5 font-medium">{sentAt}</dd>
              </div>
            )}
            {notif.status === "failed" && notif.failedReason && (
              <div>
                <dt className="text-foreground/55">{t.notifications.failedReason}</dt>
                <dd className="mt-0.5 font-mono text-xs text-red-600 break-all">{notif.failedReason}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card animate delay={2}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t.notifications.member}</p>
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
            <p className="mt-4 font-mono text-xs text-foreground/50">{notif.memberId}</p>
          )}
          {member && (
            <div className="mt-4">
              <Button href={`/app/members/${member.id}`} variant="secondary" size="sm">
                {t.notifications.viewMemberProfile}
              </Button>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
