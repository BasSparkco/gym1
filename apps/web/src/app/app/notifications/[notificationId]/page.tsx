import { getNotification } from "@/lib/notifications";
import { getMember } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/date-format";
import Link from "next/link";

type Props = { params: Promise<{ notificationId: string }> };

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
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.notifications}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.notifications.notificationDetail}</h1>
          <p className="mt-1 font-mono text-sm text-foreground/50">{notif.id}</p>
        </div>
        <Link
          href="/app/notifications"
          className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.notifications.allNotifications}
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
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
                <span
                  className={[
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    channelColors[notif.channel] ?? "bg-gray-100 text-gray-600",
                  ].join(" ")}
                >
                  {channelLabel[notif.channel] ?? notif.channel}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.notifications.statusLabel}</dt>
              <dd className="mt-0.5">
                <span
                  className={[
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    statusColors[notif.status] ?? "bg-gray-100 text-gray-600",
                  ].join(" ")}
                >
                  {notif.status}
                </span>
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
        </article>

        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
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
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      member.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {member.status === "active" ? t.status.active : t.status.inactive}
                  </span>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 font-mono text-xs text-foreground/50">{notif.memberId}</p>
          )}
          {member && (
            <div className="mt-4">
              <Link
                href={`/app/members/${member.id}`}
                className="text-xs font-medium text-brand hover:underline"
              >
                {t.notifications.viewMemberProfile}
              </Link>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
