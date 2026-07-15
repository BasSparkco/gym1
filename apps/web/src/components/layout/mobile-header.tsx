"use client";

import { useState } from "react";
import { Dumbbell, Menu, X } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { MemberSearchInput } from "@/components/layout/member-search-input";
import { NavMenu } from "@/components/layout/nav-menu";
import type { SessionUser, UserRole } from "@/lib/auth";
import type { Dict } from "@/lib/i18n";

type MobileHeaderProps = {
  user: SessionUser;
  t: Dict;
  languageSwitcher: React.ReactNode;
  logoUrl?: string | null;
};

const roleLabelKey: Record<UserRole, keyof Dict["roles"]> = {
  owner: "owner",
  manager: "manager",
  "front-desk": "frontDesk",
};

export function MobileHeader({ user, t, languageSwitcher, logoUrl }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-brand-strong px-4 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 overflow-hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <Dumbbell className="h-[18px] w-[18px] text-white" strokeWidth={2} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
              {t.shell.appName}
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {user.branch.name}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? t.shell.closeMenu : t.shell.openMenu}
          aria-expanded={open}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-colors duration-200 hover:bg-white/10 active:scale-95"
        >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <Menu
              className={[
                "absolute h-6 w-6 transition-all duration-200",
                open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
              ].join(" ")}
              strokeWidth={2}
            />
            <X
              className={[
                "absolute h-6 w-6 transition-all duration-200",
                open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
              ].join(" ")}
              strokeWidth={2}
            />
          </span>
        </button>
      </header>

      <div className="h-16" aria-hidden />

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="animate-fade-in fixed inset-x-0 bottom-0 top-16 z-30 bg-black/40"
          />
          <div className="animate-fade-in-up fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-line bg-brand-strong px-6 py-6 text-white shadow-xl">
            <div className="rounded-2xl bg-black/15 px-4 py-3">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                {t.roles[roleLabelKey[user.role]]}
              </p>
            </div>

            <div className="mt-4 border-t border-white/15" />

            <NavMenu
              role={user.role}
              navLabels={t.nav}
              onNavigate={() => setOpen(false)}
            />

            <div className="mt-6 space-y-4 border-t border-white/15 pt-6">
              <MemberSearchInput placeholder={t.shell.searchMembers} />

              {languageSwitcher}

              <SignOutButton
                name={user.name}
                role={user.role}
                label={t.auth.signOut}
                variant="button"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
