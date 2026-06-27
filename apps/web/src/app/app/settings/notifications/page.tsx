"use server";

import {
  getSettings,
  updateSettings,
  defaultNotificationSettings,
  defaultNotificationSenders,
  NotificationSettings,
  NotificationSenderSettings,
} from "@/lib/settings";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Link from "next/link";

const EVENTS = [
  "membershipExpiring",
  "membershipExpired",
  "paymentPending",
  "membershipActivated",
] as const;

type EventKey = (typeof EVENTS)[number];

const CHANNELS = ["whatsapp", "email"] as const;
type Channel = (typeof CHANNELS)[number];

function buildNotificationSettings(formData: FormData): NotificationSettings {
  const result = structuredClone(defaultNotificationSettings) as NotificationSettings;

  for (const event of EVENTS) {
    result[event].enabled = formData.get(`${event}_enabled`) === "on";
    for (const channel of CHANNELS) {
      result[event].channels[channel] = formData.get(`${event}_${channel}`) === "on";
    }
    // SMS stays in the data model but is always disabled from the UI
    result[event].channels.sms = false;
  }

  const daysBeforeRaw = Number(formData.get("membershipExpiring_daysBefore"));
  result.membershipExpiring.daysBefore =
    Number.isFinite(daysBeforeRaw) && daysBeforeRaw >= 1
      ? Math.min(Math.round(daysBeforeRaw), 30)
      : 3;

  return result;
}

function buildNotificationSenders(formData: FormData): NotificationSenderSettings {
  const asString = (value: FormDataEntryValue | null) =>
    typeof value === "string" ? value.trim() || undefined : undefined;

  return {
    emailFrom: asString(formData.get("sender_emailFrom")),
  };
}

export default async function NotificationSettingsPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const settings = await getSettings();
  const ns = settings.notificationSettings ?? defaultNotificationSettings;
  const senders = settings.notificationSenders ?? defaultNotificationSenders;

  async function handleSave(formData: FormData) {
    "use server";
    await updateSettings({
      notificationSettings: buildNotificationSettings(formData),
      notificationSenders: buildNotificationSenders(formData),
    });
    redirect("/app/settings/notifications");
  }

  const eventLabels: Record<EventKey, string> = {
    membershipExpiring: t.settings.eventMembershipExpiring,
    membershipExpired: t.settings.eventMembershipExpired,
    paymentPending: t.settings.eventPaymentPending,
    membershipActivated: t.settings.eventMembershipActivated,
  };

  const eventHelp: Record<EventKey, string> = {
    membershipExpiring: t.settings.eventMembershipExpiringHelp,
    membershipExpired: t.settings.eventMembershipExpiredHelp,
    paymentPending: t.settings.eventPaymentPendingHelp,
    membershipActivated: t.settings.eventMembershipActivatedHelp,
  };

  const channelLabels: Record<Channel, string> = {
    whatsapp: t.settings.channelWhatsapp,
    email: t.settings.channelEmail,
  };

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.settings.title} · {t.nav.notifications}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t.settings.notificationsTitle}
        </h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">
          {t.settings.notificationsDescription}
        </p>
      </section>

      {/* Sub-nav */}
      <nav className="flex gap-2 flex-wrap">
        <Link
          href="/app/settings/branch"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.branches.title}
        </Link>
        <Link
          href="/app/settings/language"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.settings.language}
        </Link>
        <Link
          href="/app/settings/display"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.settings.display}
        </Link>
        <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white">
          {t.nav.notifications}
        </span>
        <Link
          href="/app/settings/whatsapp"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.settings.whatsapp}
        </Link>
        <Link
          href="/app/settings/gates"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.settings.gates}
        </Link>
      </nav>

      <form action={handleSave} className="grid gap-5">
        <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
          <p className="text-base font-semibold">{t.settings.sendersSectionTitle}</p>
          <p className="mt-0.5 text-xs text-foreground/60">{t.settings.sendersSectionDescription}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white px-4 py-4">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
                {t.settings.senderEmailFrom}
              </label>
              <input
                type="email"
                name="sender_emailFrom"
                defaultValue={senders.emailFrom ?? ""}
                placeholder="notices@yourgym.com"
                className="mt-3 w-full rounded-2xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <p className="mt-2 text-xs text-foreground/60">{t.settings.senderEmailFromHelp}</p>
            </div>
          </div>
        </section>

        {EVENTS.map((event) => {
          const rule = ns[event];
          const isDaysBeforeEvent = event === "membershipExpiring";

          return (
            <section
              key={event}
              className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold">{eventLabels[event]}</p>
                  <p className="mt-0.5 text-xs text-foreground/60">{eventHelp[event]}</p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-medium text-foreground/60">
                    {t.settings.enableEvent}
                  </span>
                  <input
                    type="checkbox"
                    name={`${event}_enabled`}
                    defaultChecked={rule.enabled}
                    className="h-4 w-4 rounded border-line accent-brand"
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50 mb-3">
                    {t.settings.channelsSectionTitle}
                  </p>
                  <div className="grid gap-2">
                    {CHANNELS.map((channel) => (
                      <label
                        key={channel}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-background"
                      >
                        <input
                          type="checkbox"
                          name={`${event}_${channel}`}
                          defaultChecked={rule.channels[channel]}
                          className="h-4 w-4 rounded border-line accent-brand"
                        />
                        <span className="text-sm font-medium">
                          {channelLabels[channel]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {isDaysBeforeEvent && (
                  <div className="rounded-2xl border border-line bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50 mb-3">
                      {t.settings.daysBefore}
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        name="membershipExpiring_daysBefore"
                        defaultValue={(rule as { daysBefore: number }).daysBefore}
                        min={1}
                        max={30}
                        className="w-20 rounded-2xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      />
                      <span className="text-sm text-foreground/60">
                        {t.settings.daysBeforeUnit}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            {t.settings.saveNotificationSettings}
          </button>
        </div>
      </form>
    </div>
  );
}
