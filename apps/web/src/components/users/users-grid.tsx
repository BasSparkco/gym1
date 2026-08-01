"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/components/ui/badge";
import { cn } from "@/components/ui/cn";
import { UserDetailView } from "@/components/users/user-detail-view";
import { UserEditForm } from "@/components/users/user-edit-form";
import type { StaffUser } from "@/lib/users";
import type { Dict } from "@/lib/i18n";
import { PencilLine, UserRound } from "lucide-react";

type EmployeeOption = { id: string; fullName: string; employeeNumber: string };

type Props = {
  users: StaffUser[];
  employeesById: Record<string, EmployeeOption>;
  currentUserId: string;
  canEdit: boolean;
  linkableEmployeesByUser: Record<string, EmployeeOption[]>;
  roleTone: Record<string, BadgeTone>;
  apiBaseUrl: string;
  t: Dict;
};

export function UsersGrid({
  users,
  employeesById,
  currentUserId,
  canEdit,
  linkableEmployeesByUser,
  roleTone,
  apiBaseUrl,
  t,
}: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<{ id: string; mode: "view" | "edit" } | null>(null);
  const [banner, setBanner] = useState<{ id: string; type: "success" | "error"; message: string } | null>(null);

  function toggleView(id: string) {
    setBanner(null);
    setExpanded((prev) => (prev && prev.id === id && prev.mode === "view" ? null : { id, mode: "view" }));
  }

  function toggleEdit(id: string) {
    setBanner(null);
    setExpanded((prev) => (prev && prev.id === id && prev.mode === "edit" ? null : { id, mode: "edit" }));
  }

  function handleSuccess(id: string) {
    setExpanded({ id, mode: "view" });
    setBanner({ id, type: "success", message: t.users.profileUpdated });
    router.refresh();
  }

  function handleError(id: string, message: string) {
    setBanner({ id, type: "error", message });
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {users.map((user, index) => {
        const isSelf = user.id === currentUserId;
        const isView = expanded?.id === user.id && expanded.mode === "view";
        const isEdit = expanded?.id === user.id && expanded.mode === "edit";
        const isActive = isView || isEdit;
        const linkedEmployee = user.employeeId ? employeesById[user.employeeId] : undefined;

        return (
          <Fragment key={user.id}>
            <Card
              hoverable
              animate
              delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
              className={cn(
                "flex flex-col border-s-4 border-s-brand transition-shadow",
                isActive && "ring-2 ring-brand ring-offset-2 ring-offset-background",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white text-foreground/30">
                    <UserRound className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h2 className="mt-1.5 text-lg font-semibold tracking-tight">{user.username}</h2>
                </div>
                <Badge tone={roleTone[user.role] ?? "neutral"}>{user.role}</Badge>
              </div>

              <div className="mt-3 min-h-10">
                <p className="text-sm text-foreground/60">{user.email}</p>
                <p className="mt-0.5 text-sm text-foreground/60">
                  {t.users.homeBranch}: {user.branch.name}
                </p>
                {linkedEmployee && (
                  <p className="mt-0.5 text-sm text-foreground/60">
                    {t.users.linkedEmployee}: {linkedEmployee.fullName}
                  </p>
                )}
              </div>

              {!isSelf && (
                <div className="mt-4 flex gap-2 border-t border-line pt-4">
                  <Button
                    type="button"
                    variant={isView ? "primary" : "secondary"}
                    size="sm"
                    className="flex-1"
                    aria-pressed={isView}
                    onClick={() => toggleView(user.id)}
                  >
                    {t.actions.view}
                  </Button>
                  {canEdit && (
                    <Button
                      type="button"
                      variant={isEdit ? "primary" : "secondary"}
                      size="sm"
                      className="flex-1"
                      aria-pressed={isEdit}
                      icon={<PencilLine className="h-3.5 w-3.5" strokeWidth={2} />}
                      onClick={() => toggleEdit(user.id)}
                    >
                      {t.actions.edit}
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {isActive && (
              <div className="animate-fade-in-up rounded-[18px] border border-line bg-surface-muted/40 px-5 py-6 sm:px-7 md:col-span-2 xl:col-span-3">
                {banner?.id === user.id && (
                  <div
                    className={cn(
                      "mb-4 rounded-2xl border px-4 py-3 text-sm",
                      banner.type === "success"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700",
                    )}
                  >
                    {banner.message}
                  </div>
                )}
                {isView ? (
                  <UserDetailView user={user} linkedEmployee={linkedEmployee ?? null} t={t} />
                ) : (
                  <UserEditForm
                    userId={user.id}
                    user={user}
                    linkableEmployees={linkableEmployeesByUser[user.id] ?? []}
                    apiBaseUrl={apiBaseUrl}
                    t={t}
                    onSuccess={() => handleSuccess(user.id)}
                    onError={(message) => handleError(user.id, message)}
                    onCancel={() => setExpanded(null)}
                  />
                )}
              </div>
            )}
          </Fragment>
        );
      })}
    </section>
  );
}
