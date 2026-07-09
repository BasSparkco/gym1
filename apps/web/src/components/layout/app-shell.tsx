import { SignOutButton } from "@/components/auth/sign-out-button";
import { MemberSearchInput } from "@/components/layout/member-search-input";
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
};

export function AppShell({ children, user, t, viewingAllBranches }: AppShellProps) {
  return (
    <div className="bg-background text-foreground lg:h-screen lg:overflow-hidden">
      <MobileHeader
        user={user}
        t={t}
        languageSwitcher={<LanguageSwitcher variant="dark" />}
      />

      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:h-full lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-b border-line bg-brand-strong px-6 py-8 text-white lg:block lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              {t.shell.appName}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t.shell.appTitle}
            </h1>
            <p className="max-w-xs text-sm leading-6 text-white/70">
              {t.shell.appDescription}
            </p>
          </div>

          <NavMenu role={user.role} navLabels={t.nav} />
        </aside>

        <div className="flex min-h-screen flex-col lg:h-full lg:min-h-0 lg:overflow-hidden">
          <header className="hidden shrink-0 border-b border-line bg-surface/90 px-6 py-4 backdrop-blur lg:block">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
                  {t.shell.pilotBranchContext}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {user.branch.name}
                  </h2>
                  {viewingAllBranches && (
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                      {t.settings.dataVisibilityAllBranches}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-foreground/60">{user.tenant.name}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <MemberSearchInput placeholder={t.shell.searchMembers} />
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
