import { listNotifications } from "@/lib/notifications";
import { listMembers } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/date-format";
import Link from "next/link";

const channelLabel: Record<string, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  email: "Email",
};

const channelColors: Record<string, string> = {
  sms: "bg-blue-100 text-blue-700",
  whatsapp: "bg-green-100 text-green-700",
  email: "bg-purple-100 text-purple-700",
};

const statusColors: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
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
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.notifications}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.notifications.title}</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""} in history.
          </p>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
        {notifications.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.notifications.noNotifications}</p>
        ) : (
          <div className="grid gap-2">
            {notifications.map((notif) => {
              const member = memberMap.get(notif.memberId);
              const localTime = formatDateTime(notif.createdAt, dateFormat);

              return (
                <Link
                  key={notif.id}
                  href={`/app/notifications/${notif.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-3.5 text-sm transition hover:border-brand hover:text-brand"
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
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        channelColors[notif.channel] ?? "bg-gray-100 text-gray-600",
                      ].join(" ")}
                    >
                      {channelLabel[notif.channel] ?? notif.channel}
                    </span>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        statusColors[notif.status] ?? "bg-gray-100 text-gray-600",
                      ].join(" ")}
                    >
                      {notif.status}
                    </span>
                    <span className="text-xs">{localTime}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
