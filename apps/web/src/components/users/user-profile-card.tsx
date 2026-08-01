"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PencilLine } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { StaffUser } from "@/lib/users";
import type { Employee } from "@/lib/employees";
import { UserDetailView } from "@/components/users/user-detail-view";
import { UserEditForm } from "@/components/users/user-edit-form";

type EmployeeOption = { id: string; fullName: string; employeeNumber: string };

type Props = {
  userId: string;
  user: StaffUser;
  linkedEmployee: Employee | null;
  linkableEmployees: EmployeeOption[];
  canEdit: boolean;
  apiBaseUrl: string;
  t: Dict;
};

export function UserProfileCard({
  userId,
  user,
  linkedEmployee,
  linkableEmployees,
  canEdit,
  apiBaseUrl,
  t,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSuccess() {
    setMode("view");
    setBanner({ type: "success", message: t.users.profileUpdated });
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setBanner(null), 3000);
    router.refresh();
  }

  function handleError(message: string) {
    setBanner({ type: "error", message });
  }

  return (
    <div className="grid gap-4">
      {banner && (
        <div
          className={
            banner.type === "success"
              ? "rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {banner.message}
        </div>
      )}

      {mode === "view" ? (
        <UserDetailView
          user={user}
          linkedEmployee={linkedEmployee}
          t={t}
          headerAction={
            canEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<PencilLine className="h-3.5 w-3.5" strokeWidth={2} />}
                onClick={() => setMode("edit")}
              >
                {t.actions.edit}
              </Button>
            )
          }
        />
      ) : (
        <UserEditForm
          userId={userId}
          user={user}
          linkableEmployees={linkableEmployees}
          apiBaseUrl={apiBaseUrl}
          t={t}
          onSuccess={handleSuccess}
          onError={handleError}
          onCancel={() => setMode("view")}
        />
      )}
    </div>
  );
}
