import "server-only";
import { getLang } from "@/lib/i18n";
import { LANG_COOKIE, Language, getSettings } from "@/lib/settings";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export async function LanguageSwitcher() {
  const [currentLang, settings] = await Promise.all([getLang(), getSettings()]);
  const { enabledLanguages } = settings;

  if (enabledLanguages.length <= 1) return null;

  async function switchLang(formData: FormData) {
    "use server";
    const lang = formData.get("lang") as Language;
    if (!lang) return;
    const cookieStore = await cookies();
    cookieStore.set(LANG_COOKIE, lang, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
    const headersList = await headers();
    const referer = headersList.get("referer") ?? "/app/dashboard";
    redirect(referer);
  }

  return (
    <div className="flex gap-1">
      {enabledLanguages.map((lang) => {
        const isActive = lang === currentLang;
        return isActive ? (
          <span
            key={lang}
            className="rounded-full bg-brand px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white"
          >
            {lang}
          </span>
        ) : (
          <form key={lang} action={switchLang}>
            <input type="hidden" name="lang" value={lang} />
            <button
              type="submit"
              className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/60 transition hover:border-brand hover:text-brand"
            >
              {lang}
            </button>
          </form>
        );
      })}
    </div>
  );
}
