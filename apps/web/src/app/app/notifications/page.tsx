import { listNotifications } from "@/lib/notifications";
import { listMembers } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/date-format";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { BadgeTone } from "@/components/ui/badge";
import { Bell } from "lucide-react";

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

export default async function NotificationsPage() {
  await requireSession();
  const t = await getT();

  const [notifications, members, settings] = await Promise.all([
    listNotifications(),
    listMembers(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.notifications}
        title={t.notifications.title}
        description={formatDict(t.notifications.listDescription, { count: notifications.length, plural: notifications.length !== 1 ? "s" : "" })}
      />

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-5 w-5" strokeWidth={2} />} title={t.notifications.noNotifications} />
      ) : (
        <section className="grid gap-3">
          {notifications.map((notif, index) => {
            const member = memberMap.get(notif.memberId);
            const localTime = formatDateTime(notif.createdAt, dateFormat);

            return (
              <Card
                key={notif.id}
                as={Link}
                href={`/app/notifications/${notif.id}`}
                hoverable
                animate
                delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
                className="flex flex-wrap items-center justify-between gap-3 !px-5 !py-3.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold uppercase">
                    {member ? member.fullName[0] : "?"}
                  </div>
                  <div>
                    <p className="font-medium">{notif.subject}</p>
                    <p className="text-xs text-foreground/50">
                      {member ? member.fullName : notif.memberId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-foreground/60">
                  <Badge tone={channelTone[notif.channel] ?? "neutral"}>
                    {channelLabel[notif.channel] ?? notif.channel}
                  </Badge>
                  <Badge tone={statusTone[notif.status] ?? "neutral"}>
                    {notif.status}
                  </Badge>
                  <span className="text-xs">{localTime}</span>
                </div>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
