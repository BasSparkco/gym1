"use client";

import type { UserRole } from "@/lib/auth";
import type { Dict } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  labelKey: keyof Dict["nav"];
  href?: string;
  roles: UserRole[];
};

const navigationItems: NavigationItem[] = [
  {
    labelKey: "dashboard",
    href: "/app/dashboard",
    roles: ["owner", "manager", "front-desk"],
  },
  {
    labelKey: "branches",
    href: "/app/branches",
    roles: ["owner", "manager"],
  },
  {
    labelKey: "usersRoles",
    href: "/app/users",
    roles: ["owner", "manager"],
  },
  {
    labelKey: "employees",
    href: "/app/employees",
    roles: ["owner", "manager"],
  },
  {
    labelKey: "membershipPlans",
    href: "/app/membership-plans",
    roles: ["owner", "manager"],
  },
  {
    labelKey: "members",
    href: "/app/members",
    roles: ["owner", "manager", "front-desk"],
  },
  {
    labelKey: "checkIn",
    href: "/app/check-in",
    roles: ["owner", "manager", "front-desk"],
  },
  {
    labelKey: "visits",
    href: "/app/visits",
    roles: ["owner", "manager", "front-desk"],
  },
  {
    labelKey: "notifications",
    href: "/app/notifications",
    roles: ["owner", "manager", "front-desk"],
  },
  {
    labelKey: "reports",
    href: "/app/reports",
    roles: ["owner", "manager"],
  },
  {
    labelKey: "settings",
    href: "/app/settings",
    roles: ["owner"],
  },
];

type NavMenuProps = {
  role: UserRole;
  navLabels: Dict["nav"];
};

export function NavMenu({ role, navLabels }: NavMenuProps) {
  const pathname = usePathname();
  const allowedItems = navigationItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="mt-10 grid gap-2">
      {allowedItems.map((item) => {
        const label = navLabels[item.labelKey];
        const isActive = item.href
          ? pathname === item.href || pathname.startsWith(item.href + "/")
          : false;

        return item.href ? (
          <Link
            key={item.labelKey}
            href={item.href}
            className={[
              "rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-white shadow-sm"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            ].join(" ")}
            style={isActive ? { color: "var(--brand-strong)" } : undefined}
          >
            {label}
          </Link>
        ) : (
          <div
            key={item.labelKey}
            className="rounded-2xl px-4 py-3 text-sm font-medium text-white/70"
          >
            <div className="flex items-center justify-between gap-3">
              <span>{label}</span>
              <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/55">
                Planned
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
