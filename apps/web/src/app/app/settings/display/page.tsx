"use server";

import { type DateFormat, getSettings, updateSettings } from "@/lib/settings";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Link from "next/link";

const DATE_FORMATS: DateFormat[] = ["dd/mm/yyyy", "mm/dd/yyyy"];

export default async function DisplaySettingsPage() {
  await requireSession();
  const t = await getT();
  const settings = await getSettings();

  async function handleSave(formData: FormData) {
    "use server";
    const dateFormat = formData.get("dateFormat") as DateFormat;
    await updateSettings({ dateFormat });
    redirect("/app/settings/display");
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.settings.title} · {t.settings.display}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t.settings.displayTitle}
        </h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">
          {t.settings.displayDescription}
        </p>
      </section>

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
        <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white">
          {t.settings.display}
        </span>
        <Link
          href="/app/settings/notifications"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.nav.notifications}
        </Link>
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

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleSave} className="grid gap-8">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">{t.settings.dateFormat}</label>
            <p className="text-xs text-foreground/60">{t.settings.dateFormatHelp}</p>
            <div className="mt-1 grid gap-2 rounded-2xl border border-line bg-white px-4 py-3">
              {DATE_FORMATS.map((fmt) => (
                <label
                  key={fmt}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-background"
                >
                  <input
                    type="radio"
                    name="dateFormat"
                    value={fmt}
                    defaultChecked={(settings.dateFormat ?? "dd/mm/yyyy") === fmt}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="text-sm font-medium">
                    {fmt === "dd/mm/yyyy" ? t.settings.dateFormatDDMMYYYY : t.settings.dateFormatMMDDYYYY}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              {t.settings.saveDisplaySettings}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
