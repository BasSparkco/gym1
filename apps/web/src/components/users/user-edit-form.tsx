"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { StaffUser } from "@/lib/users";

const inputClass =
  "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

type EmployeeOption = { id: string; fullName: string; employeeNumber: string };

// The single canonical shape a user edit form is built from. Both the
// dedicated /app/users/[userId] page and the users-list inline expansion
// (UsersGrid) render through this component, so the two never drift apart.
type Props = {
  userId: string;
  user: StaffUser;
  linkableEmployees: EmployeeOption[];
  apiBaseUrl: string;
  t: Dict;
  onSuccess: (updated: StaffUser) => void;
  onError: (message: string) => void;
  onCancel: () => void;
};

export function UserEditForm({
  userId,
  user,
  linkableEmployees,
  apiBaseUrl,
  t,
  onSuccess,
  onError,
  onCancel,
}: Props) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim();
    const employeeId = formData.get("employeeId") as string;

    const body: Record<string, string> = { name, email };
    if (employeeId !== user.employeeId) {
      body.employeeId = employeeId;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/users/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        onError(payload.message ?? t.users.updateFailed);
        setSaving(false);
        return;
      }

      const payload = (await res.json()) as { user: StaffUser };
      setSaving(false);
      onSuccess(payload.user);
    } catch {
      onError(t.users.updateFailed);
      setSaving(false);
    }
  }

  return (
    <Card animate className="border-s-4 border-s-brand">
      <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-5">
        <div className="grid gap-1.5">
          <label htmlFor={`name-${userId}`} className="text-sm font-medium">
            {t.users.name}
          </label>
          <input
            id={`name-${userId}`}
            name="name"
            required
            defaultValue={user.name}
            className={inputClass}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={`email-${userId}`} className="text-sm font-medium">
            {t.users.email}
          </label>
          <input
            id={`email-${userId}`}
            name="email"
            type="email"
            required
            defaultValue={user.email}
            className={inputClass}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={`employeeId-${userId}`} className="text-sm font-medium">
            {t.users.linkedEmployee}
          </label>
          <select
            id={`employeeId-${userId}`}
            name="employeeId"
            required
            defaultValue={user.employeeId ?? ""}
            aria-label={t.users.selectEmployee}
            className={inputClass}
          >
            {linkableEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.employeeNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            icon={<Save className="h-4 w-4" strokeWidth={2} />}
          >
            {t.actions.saveChanges}
          </Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={onCancel}>
            {t.actions.cancel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
