"use server";

import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Info } from "lucide-react";
import { LANGUAGE_LABELS } from "@/lib/settings";
import {
  listNotificationTemplates,
  saveNotificationTemplate,
  resetNotificationTemplate,
  NOTIFICATION_TEMPLATE_KEYS,
  NotificationTemplateKey,
} from "@/lib/notification-templates";

export default async function NotificationTemplatesPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const templates = await listNotificationTemplates();

  const eventLabels: Record<NotificationTemplateKey, string> = {
    membershipExpiring: t.settings.eventMembershipExpiring,
    membershipExpired: t.settings.eventMembershipExpired,
    paymentPending: t.settings.eventPaymentPending,
    membershipActivated: t.settings.eventMembershipActivated,
    membershipRenewed: t.settings.eventMembershipRenewed,
    birthday: t.settings.eventBirthday,
  };

  const eventHelp: Record<NotificationTemplateKey, string> = {
    membershipExpiring: t.settings.eventMembershipExpiringHelp,
    membershipExpired: t.settings.eventMembershipExpiredHelp,
    paymentPending: t.settings.eventPaymentPendingHelp,
    membershipActivated: t.settings.eventMembershipActivatedHelp,
    membershipRenewed: t.settings.eventMembershipRenewedHelp,
    birthday: t.settings.eventBirthdayHelp,
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`${t.settings.title} · ${t.nav.notifications}`}
        title={t.settings.templatesTitle}
        description={t.settings.templatesDescription}
      />

      {/* Sub-nav */}
      <nav className="flex gap-2 flex-wrap">
        <Link
          href="/app/settings/branch"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
        >
          {t.branches.title}
        </Link>
        <Link
          href="/app/settings/options"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
        >
          {t.settings.options}
        </Link>
        <Link
          href="/app/settings/notifications"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
        >
          {t.nav.notifications}
        </Link>
        <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white shadow-sm">
          {t.settings.templates}
        </span>
        <Link
          href="/app/settings/gates"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
        >
          {t.settings.gates}
        </Link>
      </nav>

      <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-foreground/80">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
        <p>
          {t.settings.templatesLanguageNote}{" "}
          <Link href="/app/settings/options" className="font-medium text-brand underline underline-offset-2">
            {t.settings.options}
          </Link>
        </p>
      </div>

      <div className="grid gap-5">
        {NOTIFICATION_TEMPLATE_KEYS.map((templateKey) => {
          const rows = templates.filter((tpl) => tpl.templateKey === templateKey);

          return (
            <section
              key={templateKey}
              className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]"
            >
              <p className="text-base font-semibold">{eventLabels[templateKey]}</p>
              <p className="mt-0.5 text-xs text-foreground/60">{eventHelp[templateKey]}</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {rows.map((tpl) => {
                  async function handleSave(formData: FormData) {
                    "use server";
                    await saveNotificationTemplate(
                      templateKey,
                      tpl.lang,
                      String(formData.get("subject") ?? ""),
                      String(formData.get("body") ?? ""),
                    );
                    redirect("/app/settings/notifications/templates");
                  }

                  async function handleReset() {
                    "use server";
                    await resetNotificationTemplate(templateKey, tpl.lang);
                    redirect("/app/settings/notifications/templates");
                  }

                  return (
                    <div
                      key={tpl.lang}
                      className="rounded-2xl border border-line bg-white px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
                          {LANGUAGE_LABELS[tpl.lang]}
                        </p>
                        <span
                          className={
                            tpl.isCustomized
                              ? "rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-medium text-brand"
                              : "rounded-full bg-background px-2.5 py-0.5 text-[10px] font-medium text-foreground/50"
                          }
                        >
                          {tpl.isCustomized
                            ? t.settings.templateCustomBadge
                            : t.settings.templateDefaultBadge}
                        </span>
                      </div>

                      <form action={handleSave} className="mt-3 grid gap-3">
                        <div>
                          <label className="text-xs font-medium text-foreground/60">
                            {t.settings.templateSubjectLabel}
                          </label>
                          <input
                            type="text"
                            name="subject"
                            defaultValue={tpl.subject}
                            required
                            className="mt-1 w-full rounded-2xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-foreground/60">
                            {t.settings.templateBodyLabel}
                          </label>
                          <textarea
                            name="body"
                            defaultValue={tpl.body}
                            rows={4}
                            required
                            className="mt-1 w-full rounded-2xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                          />
                        </div>
                        {tpl.variables.length > 0 && (
                          <p className="text-xs text-foreground/50">
                            {t.settings.templateVariablesLabel}:{" "}
                            {tpl.variables.map((v) => `{{${v}}}`).join(", ")}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            icon={<Save className="h-3.5 w-3.5" strokeWidth={2} />}
                          >
                            {t.settings.templateSaveButton}
                          </Button>
                          {tpl.isCustomized && (
                            <Button
                              type="submit"
                              formAction={handleReset}
                              variant="secondary"
                              size="sm"
                              icon={<RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />}
                            >
                              {t.settings.templateResetButton}
                            </Button>
                          )}
                        </div>
                      </form>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
