"use client";

import type { UserRole } from "@/lib/auth";
import type { Dict } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CreditCard,
  DoorOpen,
  History,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";

type NavigationItem = {
  labelKey: keyof Dict["nav"];
  href?: string;
  icon: LucideIcon;
  roles: UserRole[];
};

const navigationItems: NavigationItem[] = [
  {
    labelKey: "dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "manager", "front-desk"],
  },
  {
    labelKey: "branches",
    href: "/app/branches",
    icon: Building2,
    roles: ["owner", "manager"],
  },
  {
    labelKey: "usersRoles",
    href: "/app/users",
    icon: ShieldCheck,
    roles: ["owner", "manager"],
  },
  {
    labelKey: "employees",
    href: "/app/employees",
    icon: Users,
    roles: ["owner", "manager"],
  },
  {
    labelKey: "membershipPlans",
    href: "/app/membership-plans",
    icon: CreditCard,
    roles: ["owner", "manager"],
  },
  {
    labelKey: "classes",
    href: "/app/training-programs",
    icon: CalendarCheck,
    roles: ["owner", "manager", "front-desk"],
  },
  {
    labelKey: "members",
    href: "/app/members",
    icon: UsersRound,
    roles: ["owner", "manager", "front-desk"],
  },
  {
    labelKey: "checkIn",
    href: "/app/check-in",
    icon: DoorOpen,
    roles: ["owner", "manager", "front-desk"],
  },
  {
    labelKey: "visits",
    href: "/app/visits",
    icon: History,
    roles: ["owner", "manager", "front-desk"],
  },
  {
    labelKey: "notifications",
    href: "/app/notifications",
    icon: Bell,
    roles: ["owner", "manager", "front-desk"],
  },
  {
    labelKey: "reports",
    href: "/app/reports",
    icon: BarChart3,
    roles: ["owner", "manager"],
  },
  {
    labelKey: "settings",
    href: "/app/settings",
    icon: Settings,
    roles: ["owner"],
  },
];

type NavMenuProps = {
  role: UserRole;
  navLabels: Dict["nav"];
  onNavigate?: () => void;
};

export function NavMenu({ role, navLabels, onNavigate }: NavMenuProps) {
  const pathname = usePathname();
  const allowedItems = navigationItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="mt-10 grid gap-1">
      {allowedItems.map((item) => {
        const label = navLabels[item.labelKey];
        const Icon = item.icon;
        const isActive = item.href
          ? pathname === item.href || pathname.startsWith(item.href + "/")
          : false;

        return item.href ? (
          <Link
            key={item.labelKey}
            href={item.href}
            onClick={onNavigate}
            className={[
              "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-white shadow-sm"
                : "text-white/75 hover:translate-x-0.5 hover:bg-white/10 hover:text-white",
            ].join(" ")}
            style={isActive ? { color: "var(--brand-strong)" } : undefined}
          >
            <span
              className={[
                "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-accent transition-all duration-200",
                isActive ? "opacity-100" : "opacity-0",
              ].join(" ")}
              aria-hidden
            />
            <Icon
              className={[
                "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                isActive ? "" : "text-white/60 group-hover:text-white group-hover:scale-110",
              ].join(" ")}
              strokeWidth={2}
            />
            <span className="truncate">{label}</span>
          </Link>
        ) : (
          <div
            key={item.labelKey}
            className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/70"
          >
            <span className="flex items-center gap-3">
              <Icon className="h-[18px] w-[18px] shrink-0 text-white/40" strokeWidth={2} />
              {label}
            </span>
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/55">
              Planned
            </span>
          </div>
        );
      })}
    </nav>
  );
}
