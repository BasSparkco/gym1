"use server";

import {
  LANG_COOKIE,
  LANGUAGE_LABELS,
  Language,
  DateFormat,
  OwnerDataScope,
  getSettings,
  updateSettings,
} from "@/lib/settings";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

const ALL_LANGUAGES: Language[] = ["en", "ar", "he"];
const DATE_FORMATS: DateFormat[] = ["dd/mm/yyyy", "mm/dd/yyyy"];
const OWNER_DATA_SCOPES: OwnerDataScope[] = ["all", "activeBranch"];

export default async function OptionsSettingsPage() {
  const session = await requireSession();
  const t = await getT();
  const settings = await getSettings();
  const isOwner = session.role === "owner";

  async function handleSave(formData: FormData) {
    "use server";

    const defaultLanguage = formData.get("defaultLanguage") as Language;
    const enabledLanguages = ALL_LANGUAGES.filter(
      (lang) => formData.get(`lang_${lang}`) === "on" || lang === defaultLanguage,
    );
    const dateFormat = formData.get("dateFormat") as DateFormat;
    const checkOutTrackingEnabled = formData.get("checkOutTrackingEnabled") === "on";
    const ownerDataScope = formData.get("ownerDataScope") as
      | OwnerDataScope
      | null;

    const saved = await updateSettings({
      defaultLanguage,
      enabledLanguages,
      dateFormat,
      checkOutTrackingEnabled,
      ...(ownerDataScope ? { ownerDataScope } : {}),
    });

    const cookieStore = await cookies();
    cookieStore.set(LANG_COOKIE, saved.defaultLanguage, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });

    redirect("/app/settings/options");
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.settings.title} · {t.settings.options}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t.settings.optionsTitle}
        </h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">
          {t.settings.optionsDescription}
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
        <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white">
          {t.settings.options}
        </span>
        <Link
          href="/app/settings/notifications"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.nav.notifications}
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
          {/* Language */}
          <div className="grid gap-4">
            <p className="text-base font-semibold">{t.settings.languageConfig}</p>

            <div className="grid gap-1.5">
              <label htmlFor="defaultLanguage" className="text-sm font-medium">
                {t.settings.defaultLanguage}
              </label>
              <p className="text-xs text-foreground/60">
                {t.settings.defaultLanguageHelp}
              </p>
              <select
                id="defaultLanguage"
                name="defaultLanguage"
                defaultValue={settings.defaultLanguage}
                className="mt-1 rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {ALL_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <div>
                <p className="text-sm font-medium">{t.settings.availableLanguages}</p>
                <p className="mt-1 text-xs text-foreground/60">
                  {t.settings.availableLanguagesHelp}
                </p>
              </div>

              <div className="grid gap-2 rounded-2xl border border-line bg-white px-4 py-3">
                {ALL_LANGUAGES.map((lang) => {
                  const isDefault = lang === settings.defaultLanguage;
                  const isEnabled = settings.enabledLanguages.includes(lang);

                  return (
                    <label
                      key={lang}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-2 py-2.5 transition hover:bg-background"
                    >
                      <div className="flex items-center gap-3">
                        {isDefault && (
                          <input type="hidden" name={`lang_${lang}`} value="on" />
                        )}
                        <input
                          type="checkbox"
                          name={`lang_${lang}`}
                          defaultChecked={isEnabled}
                          disabled={isDefault}
                          className="h-4 w-4 rounded border-line accent-brand"
                        />
                        <span className="text-sm font-medium">
                          {LANGUAGE_LABELS[lang]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider text-foreground/50">
                          {lang}
                        </span>
                        {lang === "ar" || lang === "he" ? (
                          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                            RTL
                          </span>
                        ) : null}
                        {isDefault ? (
                          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                            {t.settings.defaultBadge}
                          </span>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-px bg-line" />

          {/* Display */}
          <div className="grid gap-4">
            <p className="text-base font-semibold">{t.settings.displayTitle}</p>

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
          </div>

          {isOwner && (
            <>
              <div className="h-px bg-line" />

              {/* Data visibility (owner only) */}
              <div className="grid gap-4">
                <div>
                  <p className="text-base font-semibold">
                    {t.settings.dataVisibilityTitle}
                  </p>
                  <p className="mt-1 text-xs text-foreground/60">
                    {t.settings.dataVisibilityHelp}
                  </p>
                </div>

                <div className="grid gap-2 rounded-2xl border border-line bg-white px-4 py-3">
                  {OWNER_DATA_SCOPES.map((scope) => (
                    <label
                      key={scope}
                      className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-background"
                    >
                      <input
                        type="radio"
                        name="ownerDataScope"
                        value={scope}
                        defaultChecked={
                          (settings.ownerDataScope ?? "all") === scope
                        }
                        className="mt-0.5 h-4 w-4 accent-brand"
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {scope === "all"
                            ? t.settings.dataVisibilityAllBranches
                            : t.settings.dataVisibilityActiveBranch}
                        </span>
                        <span className="mt-0.5 block text-xs text-foreground/60">
                          {scope === "all"
                            ? t.settings.dataVisibilityAllBranchesHelp
                            : t.settings.dataVisibilityActiveBranchHelp}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-line" />

          {/* Check-in / Check-out */}
          <div className="grid gap-4">
            <p className="text-base font-semibold">{t.settings.checkInOutSectionTitle}</p>

            <div className="rounded-2xl border border-line bg-white px-4 py-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="checkOutTrackingEnabled"
                  defaultChecked={settings.checkOutTrackingEnabled}
                  className="mt-0.5 h-4 w-4 rounded border-line accent-brand"
                />
                <span>
                  <span className="block text-sm font-medium">
                    {t.settings.checkOutToggleLabel}
                  </span>
                  <span className="mt-0.5 block text-xs text-foreground/60">
                    {t.settings.checkOutToggleHelp}
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              {t.actions.saveChanges}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-foreground/50">
          {t.settings.supportedLanguages}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {ALL_LANGUAGES.map((lang) => (
            <div
              key={lang}
              className="rounded-2xl border border-line bg-white px-4 py-3"
            >
              <p className="text-base font-medium">{LANGUAGE_LABELS[lang]}</p>
              <p className="mt-0.5 text-xs text-foreground/50 uppercase tracking-wide">
                {lang === "ar" || lang === "he" ? t.settings.rightToLeft : t.settings.leftToRight}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
