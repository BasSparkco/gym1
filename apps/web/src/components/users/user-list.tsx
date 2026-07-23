"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BadgeTone } from "@/components/ui/badge";
import EmployeeCombobox, { type EmployeeOption } from "@/components/employee-combobox";
import { linkEmployeeAction } from "@/app/app/users/actions";
import type { StaffUser } from "@/lib/users";
import type { Dict } from "@/lib/i18n";
import { Save } from "lucide-react";

type Props = {
  users: StaffUser[];
  employeesById: Record<string, EmployeeOption>;
  currentUserId: string;
  canEdit: boolean;
  linkableEmployeesByUser: Record<string, EmployeeOption[]>;
  roleTone: Record<string, BadgeTone>;
  t: Dict;
};

export function UserList({
  users,
  employeesById,
  currentUserId,
  canEdit,
  linkableEmployeesByUser,
  roleTone,
  t,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="grid gap-3">
      {users.map((user, index) => {
        const clickable = user.id !== currentUserId;
        const expanded = expandedId === user.id;
        const linkedEmployee = user.employeeId ? employeesById[user.employeeId] : undefined;

        return (
          <Card
            key={user.id}
            hoverable
            animate
            delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
            className={clickable ? "cursor-pointer" : undefined}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? () => setExpandedId(expanded ? null : user.id) : undefined}
            onKeyDown={
              clickable
                ? (event: React.KeyboardEvent) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setExpandedId(expanded ? null : user.id);
                    }
                  }
                : undefined
            }
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{user.name}</h2>
                  <Badge tone={roleTone[user.role] ?? "neutral"}>{user.role}</Badge>
                </div>
                <p className="mt-1 text-sm text-foreground/55">{user.email}</p>
                <p className="mt-0.5 text-sm text-foreground/45">
                  {t.users.homeBranch}: {user.branch.name}
                </p>
                <p className="mt-0.5 text-sm text-foreground/45">
                  {t.users.linkedEmployee}:{" "}
                  {linkedEmployee ? (
                    linkedEmployee.fullName
                  ) : (
                    <span className="font-medium text-red-600">{t.users.notLinked}</span>
                  )}
                </p>
              </div>
            </div>

            {expanded && (
              <div
                className="mt-4 grid gap-4 border-t border-line pt-4 md:grid-cols-2"
                onClick={(event) => event.stopPropagation()}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
                    {t.users.staffDetails}
                  </p>
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

                  {canEdit && (
                    <div className="mt-5 border-t border-line pt-5">
                      <p className="text-sm font-medium">{t.users.editLink}</p>
                      <form
                        action={linkEmployeeAction}
                        className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start"
                      >
                        <input type="hidden" name="userId" value={user.id} />
                        <div className="flex-1">
                          <EmployeeCombobox
                            name="employeeId"
                            options={linkableEmployeesByUser[user.id] ?? []}
                            defaultValue={user.employeeId ?? undefined}
                            placeholder={t.users.searchEmployee}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          className="shrink-0"
                          icon={<Save className="h-3.5 w-3.5" strokeWidth={2} />}
                        >
                          {t.actions.save}
                        </Button>
                      </form>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">System</p>
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
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </section>
  );
}
