import { Dumbbell } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { MemberSearchInput } from "@/components/layout/member-search-input";
import { MessagesBell } from "@/components/layout/messages-bell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { NavMenu } from "@/components/layout/nav-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { SessionUser } from "@/lib/auth";
import type { Dict } from "@/lib/i18n";

type AppShellProps = {
  user: SessionUser;
  children: React.ReactNode;
  t: Dict;
  viewingAllBranches?: boolean;
  logoUrl?: string | null;
};

export function AppShell({ children, user, t, viewingAllBranches, logoUrl }: AppShellProps) {
  return (
    <div className="bg-background text-foreground lg:h-screen lg:overflow-hidden">
      <MobileHeader
        user={user}
        t={t}
        languageSwitcher={<LanguageSwitcher variant="dark" />}
      />

      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:h-full lg:grid-cols-[280px_1fr]">
        <aside
          className="hidden border-b border-line px-6 py-8 text-white shadow-[inset_-1px_0_0_rgba(0,0,0,0.25)] lg:flex lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r"
          style={{
            background:
              "radial-gradient(160% 120% at 0% 0%, rgba(201,242,75,0.07), transparent 55%), radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.04), transparent 50%), linear-gradient(180deg, var(--brand-deeper) 0%, var(--brand-strong) 55%, #081a15 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/10 ring-1 ring-accent/25">
              <Dumbbell className="h-5 w-5 text-accent" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-extrabold tracking-tight">
                <span className="text-white">Spark</span>
                <span className="bg-gradient-to-b from-[#FFE066] to-[#F5A623] bg-clip-text text-transparent">
                  Gym
                </span>
                <span className="ml-1.5 font-semibold text-white/70">ERP</span>
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {t.shell.appTitle}
            </h1>
            <p className="max-w-xs text-sm leading-6 text-white/60">
              {t.shell.appDescription}
            </p>
          </div>

          <NavMenu role={user.role} navLabels={t.nav} />
        </aside>

        <div className="flex min-h-screen flex-col lg:h-full lg:min-h-0 lg:overflow-hidden">
          <header className="sticky top-0 z-20 hidden shrink-0 border-b border-line bg-surface/85 px-6 py-4 backdrop-blur-md lg:block">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-2xl bg-white object-contain ring-1 ring-line"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand/10 ring-1 ring-line">
                    <Dumbbell className="h-7 w-7 text-brand" strokeWidth={2} />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    {user.branch.name}
                  </h2>
                  {viewingAllBranches && (
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                      {t.settings.dataVisibilityAllBranches}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <MemberSearchInput placeholder={t.shell.searchMembers} />
                <MessagesBell label={t.nav.messages} />
                <LanguageSwitcher />
                <SignOutButton name={user.name} role={user.role} label={t.auth.signOut} />
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6 lg:overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
