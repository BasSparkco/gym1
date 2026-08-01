"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Dict } from "@/lib/i18n";
import type { StaffUser } from "@/lib/users";
import type { ReactNode } from "react";

type LinkedEmployee = { id: string; fullName: string; employeeNumber: string };

// The single canonical shape a user detail view is built from. Both the
// dedicated /app/users/[userId] page and the users-list inline expansion
// (UsersGrid) render through this component, so the two never drift apart.
type Props = {
  user: StaffUser;
  linkedEmployee: LinkedEmployee | null;
  t: Dict;
  headerAction?: ReactNode;
};

export function UserDetailView({ user, linkedEmployee, t, headerAction }: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card animate delay={1} className="border-s-4 border-s-brand">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.users.staffDetails}
          </p>
          {headerAction}
        </div>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-foreground/55">{t.users.email}</dt>
            <dd className="mt-0.5 font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-foreground/55">{t.users.username}</dt>
            <dd className="mt-0.5 font-mono">{user.username}</dd>
          </div>
          <div>
            <dt className="text-foreground/55">{t.users.role}</dt>
            <dd className="mt-0.5 font-medium capitalize">{user.role}</dd>
          </div>
          <div>
            <dt className="text-foreground/55">{t.users.homeBranch}</dt>
            <dd className="mt-0.5 font-medium">{user.branch.name}</dd>
          </div>
          <div>
            <dt className="text-foreground/55">{t.users.linkedEmployee}</dt>
            <dd className="mt-0.5 font-medium">
              {linkedEmployee ? (
                <Link
                  href={`/app/employees/${linkedEmployee.id}`}
                  className="text-brand hover:underline"
                >
                  {linkedEmployee.fullName}{" "}
                  <span className="font-mono text-xs text-foreground/50">
                    {linkedEmployee.employeeNumber}
                  </span>
                </Link>
              ) : (
                <span className="font-medium text-red-600">{t.users.notLinked}</span>
              )}
            </dd>
          </div>
        </dl>
      </Card>

      <Card animate delay={2} className="border-s-4 border-s-muted">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">System</p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-foreground/55">{t.users.userId}</dt>
            <dd className="mt-0.5 font-mono text-xs text-foreground/70">{user.id}</dd>
          </div>
          <div>
            <dt className="text-foreground/55">{t.users.tenant}</dt>
            <dd className="mt-0.5 font-medium">{user.tenant.name}</dd>
          </div>
        </dl>
      </Card>
    </section>
  );
}
