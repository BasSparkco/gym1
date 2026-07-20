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
      <header
        className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-line px-4 text-white"
        style={{
          background:
            "radial-gradient(160% 200% at 0% 0%, rgba(201,242,75,0.08), transparent 60%), linear-gradient(180deg, var(--brand-deeper), var(--brand-strong))",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10 ring-1 ring-accent/25">
            <Dumbbell className="h-[18px] w-[18px] text-accent" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="font-display text-xs font-extrabold tracking-tight">
              <span className="text-white">Spark</span>
              <span className="bg-gradient-to-b from-[#FFE066] to-[#F5A623] bg-clip-text text-transparent">
                Gym
              </span>
              <span className="ml-1 font-semibold text-white/70">ERP</span>
            </p>
            <h1 className="font-display truncate text-lg font-bold tracking-tight">
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
          <div
            className="animate-fade-in-up fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-line px-6 py-6 text-white shadow-xl"
            style={{
              background:
                "radial-gradient(160% 120% at 0% 0%, rgba(201,242,75,0.06), transparent 55%), linear-gradient(180deg, var(--brand-deeper), var(--brand-strong))",
            }}
          >
            <div className="rounded-[10px] bg-black/15 px-4 py-3">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
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
