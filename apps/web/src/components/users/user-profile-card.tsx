"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PencilLine, Save } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { StaffUser } from "@/lib/users";
import type { Employee } from "@/lib/employees";

const inputClass =
  "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

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
        setError(payload.message ?? t.users.updateFailed);
        setSaving(false);
        return;
      }

      setMode("view");
      setSaving(false);
      setSuccess(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch {
      setError(t.users.updateFailed);
      setSaving(false);
    }
  }

  return (
    <Card hoverable animate delay={1} className="border-s-4 border-s-brand">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          {t.users.staffDetails}
        </p>
        {canEdit && mode === "view" && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<PencilLine className="h-3.5 w-3.5" strokeWidth={2} />}
            onClick={() => setMode("edit")}
          >
            {t.actions.edit}
          </Button>
        )}
      </div>

      {success && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {t.users.profileUpdated}
        </div>
      )}

      {mode === "view" ? (
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
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 grid gap-4">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

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
              size="sm"
              disabled={saving}
              icon={<Save className="h-3.5 w-3.5" strokeWidth={2} />}
            >
              {t.actions.save}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={() => {
                setMode("view");
                setError(null);
              }}
            >
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
