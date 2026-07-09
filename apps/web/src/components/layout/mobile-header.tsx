"use client";

import { useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { MemberSearchInput } from "@/components/layout/member-search-input";
import { NavMenu } from "@/components/layout/nav-menu";
import type { SessionUser, UserRole } from "@/lib/auth";
import type { Dict } from "@/lib/i18n";

type MobileHeaderProps = {
  user: SessionUser;
  t: Dict;
  languageSwitcher: React.ReactNode;
};

const roleLabelKey: Record<UserRole, keyof Dict["roles"]> = {
  owner: "owner",
  manager: "manager",
  "front-desk": "frontDesk",
};

export function MobileHeader({ user, t, languageSwitcher }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-brand-strong px-4 text-white">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
            {t.shell.appName}
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {user.branch.name}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? t.shell.closeMenu : t.shell.openMenu}
          aria-expanded={open}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          )}
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
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/40"
          />
          <div className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-line bg-brand-strong px-6 py-6 text-white shadow-xl">
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
