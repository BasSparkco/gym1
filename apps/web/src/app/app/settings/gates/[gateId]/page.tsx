"use server";

import { listGates, updateGate, deleteGate } from "@/lib/gates";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

type Props = {
  params: Promise<{ gateId: string }>;
};

export default async function EditGatePage({ params }: Props) {
  const session = await requireSession();
  const t = await getT();
  const { gateId } = await params;

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const gates = await listGates(session.branch.id);
  const gate = gates.find((g) => g.id === gateId);
  if (!gate) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    const genderValue = formData.get("genderRestriction") as string;
    const password = (formData.get("devicePassword") as string).trim();
    await updateGate(gateId, {
      name: (formData.get("name") as string).trim(),
      genderRestriction:
        genderValue === "male" ? "male" : genderValue === "female" ? "female" : null,
      deviceUrl: (formData.get("deviceUrl") as string).trim(),
      deviceUsername: (formData.get("deviceUsername") as string).trim(),
      ...(password && { devicePassword: password }),
      lockNumber: parseInt(formData.get("lockNumber") as string, 10) || 1,
      enabled: formData.get("enabled") === "on",
    });
    redirect("/app/settings/gates");
  }

  async function handleDelete() {
    "use server";
    await deleteGate(gateId);
    redirect("/app/settings/gates");
  }

  return (
    <div className="grid gap-6">
      <section>
        <Link
          href="/app/settings/gates"
          className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-brand"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t.settings.gatesTitle}
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{gate.name}</h1>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleUpdate} className="grid gap-5">
          {/* Gate Name */}
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t.settings.gateName} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={gate.name}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Gender Restriction */}
          <div className="grid gap-1.5">
            <label htmlFor="genderRestriction" className="text-sm font-medium">
              {t.settings.gateGenderRestriction}
            </label>
            <select
              id="genderRestriction"
              name="genderRestriction"
              defaultValue={gate.genderRestriction ?? "none"}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="none">{t.settings.gateGenderNone}</option>
              <option value="male">{t.settings.gateGenderMale}</option>
              <option value="female">{t.settings.gateGenderFemale}</option>
            </select>
          </div>

          {/* Device URL */}
          <div className="grid gap-1.5">
            <label htmlFor="deviceUrl" className="text-sm font-medium">
              {t.settings.gateDeviceUrl}
            </label>
            <input
              id="deviceUrl"
              name="deviceUrl"
              defaultValue={gate.deviceUrl}
              placeholder="http://192.168.1.178"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-mono outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="text-xs text-foreground/50">{t.settings.gateDeviceUrlHelp}</p>
          </div>

          {/* Device Username */}
          <div className="grid gap-1.5">
            <label htmlFor="deviceUsername" className="text-sm font-medium">
              {t.settings.gateDeviceUsername}
            </label>
            <input
              id="deviceUsername"
              name="deviceUsername"
              defaultValue={gate.deviceUsername}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Device Password */}
          <div className="grid gap-1.5">
            <label htmlFor="devicePassword" className="text-sm font-medium">
              {t.settings.gateDevicePassword}
            </label>
            <input
              id="devicePassword"
              name="devicePassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="text-xs text-foreground/50">{t.settings.gateDevicePasswordHelp}</p>
          </div>

          {/* Lock Number */}
          <div className="grid gap-1.5">
            <label htmlFor="lockNumber" className="text-sm font-medium">
              {t.settings.gateLockNumber}
            </label>
            <input
              id="lockNumber"
              name="lockNumber"
              type="number"
              min={1}
              defaultValue={gate.lockNumber}
              className="w-24 rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-3">
            <input
              id="enabled"
              name="enabled"
              type="checkbox"
              defaultChecked={gate.enabled}
              className="h-4 w-4 rounded border-line accent-brand"
            />
            <label htmlFor="enabled" className="text-sm font-medium">
              {t.settings.gateEnabled}
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              {t.settings.gateUpdate}
            </button>
            <Link
              href="/app/settings/gates"
              className="rounded-full border border-line bg-white px-6 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              {t.actions.cancel}
            </Link>
          </div>
        </form>
      </section>

      {/* Danger zone */}
      {session.role === "owner" && (
        <section className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
            Danger zone
          </p>
          <p className="mt-2 text-sm text-red-700">{t.settings.gateDeleteConfirm}</p>
          <form action={handleDelete} className="mt-4">
            <button
              type="submit"
              className="rounded-full border border-red-400 bg-white px-6 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-500 hover:text-white"
            >
              {t.settings.gateDelete}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
