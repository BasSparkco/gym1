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
  KeySquare,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";

type NavGroup = "groupOverview" | "groupPeople" | "groupOperations" | "groupInsights";

type NavigationItem = {
  labelKey: keyof Dict["nav"];
  href?: string;
  icon: LucideIcon;
  roles: UserRole[];
  group: NavGroup;
};

const navGroups: NavGroup[] = ["groupOverview", "groupPeople", "groupOperations", "groupInsights"];

const navigationItems: NavigationItem[] = [
  {
    labelKey: "dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "manager", "front-desk"],
    group: "groupOverview",
  },
  {
    labelKey: "branches",
    href: "/app/branches",
    icon: Building2,
    roles: ["owner", "manager"],
    group: "groupOverview",
  },
  {
    labelKey: "usersRoles",
    href: "/app/users",
    icon: ShieldCheck,
    roles: ["owner", "manager"],
    group: "groupPeople",
  },
  {
    labelKey: "employees",
    href: "/app/employees",
    icon: Users,
    roles: ["owner", "manager"],
    group: "groupPeople",
  },
  {
    labelKey: "members",
    href: "/app/members",
    icon: UsersRound,
    roles: ["owner", "manager", "front-desk"],
    group: "groupPeople",
  },
  {
    labelKey: "checkIn",
    href: "/app/check-in",
    icon: DoorOpen,
    roles: ["owner", "manager", "front-desk"],
    group: "groupOperations",
  },
  {
    labelKey: "visits",
    href: "/app/visits",
    icon: History,
    roles: ["owner", "manager", "front-desk"],
    group: "groupOperations",
  },
  {
    labelKey: "classes",
    href: "/app/training-programs",
    icon: CalendarCheck,
    roles: ["owner", "manager", "front-desk"],
    group: "groupOperations",
  },
  {
    labelKey: "membershipPlans",
    href: "/app/membership-plans",
    icon: CreditCard,
    roles: ["owner", "manager"],
    group: "groupOperations",
  },
  {
    labelKey: "lockers",
    href: "/app/lockers",
    icon: KeySquare,
    roles: ["owner", "manager"],
    group: "groupOperations",
  },
  {
    labelKey: "notifications",
    href: "/app/notifications",
    icon: Bell,
    roles: ["owner", "manager", "front-desk"],
    group: "groupInsights",
  },
  {
    labelKey: "reports",
    href: "/app/reports",
    icon: BarChart3,
    roles: ["owner", "manager"],
    group: "groupInsights",
  },
  {
    labelKey: "settings",
    href: "/app/settings",
    icon: Settings,
    roles: ["owner"],
    group: "groupInsights",
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
    <nav className="mt-8 grid gap-1">
      {navGroups.map((group) => {
        const items = allowedItems.filter((item) => item.group === group);
        if (items.length === 0) return null;

        return (
          <div key={group} className="mb-1">
            <p className="font-mono px-4 pb-2 pt-4 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/40 first:pt-0">
              {navLabels[group]}
            </p>
            <div className="grid gap-1">
              {items.map((item) => {
                const label = navLabels[item.labelKey];
                const Icon = item.icon;
                const isActive = item.href
                  ? pathname === item.href || pathname.startsWith(item.href + "/")
                  : false;

                return (
                  <Link
                    key={item.labelKey}
                    href={item.href!}
                    onClick={onNavigate}
                    className={[
                      "group relative flex items-center gap-3 rounded-[10px] px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-accent/[0.14] text-accent ring-1 ring-inset ring-accent/25"
                        : "text-white/70 hover:translate-x-0.5 hover:bg-white/[0.06] hover:text-white",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute start-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-accent transition-all duration-200",
                        isActive ? "opacity-100" : "opacity-0",
                      ].join(" ")}
                      aria-hidden
                    />
                    <Icon
                      className={[
                        "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                        isActive ? "text-accent" : "text-white/55 group-hover:text-white group-hover:scale-110",
                      ].join(" ")}
                      strokeWidth={2}
                    />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
