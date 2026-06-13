import { SignOutButton } from "@/components/auth/sign-out-button";
import { MemberSearchInput } from "@/components/layout/member-search-input";
import { NavMenu } from "@/components/layout/nav-menu";
import type { SessionUser } from "@/lib/auth";
import type { Dict } from "@/lib/i18n";

type AppShellProps = {
  user: SessionUser;
  children: React.ReactNode;
  t: Dict;
};

export function AppShell({ children, user, t }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-line bg-brand-strong px-6 py-8 text-white lg:border-r lg:border-b-0">
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

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-line bg-surface/90 px-6 py-4 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
                  {t.shell.pilotBranchContext}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {user.branch.name}
                </h2>
                <p className="mt-2 text-sm text-foreground/60">{user.tenant.name}</p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <MemberSearchInput placeholder={t.shell.searchMembers} />
                <SignOutButton name={user.name} role={user.role} label={t.auth.signOut} />
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
