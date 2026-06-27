"use server";

import { createGate } from "@/lib/gates";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewGatePage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  async function handleCreate(formData: FormData) {
    "use server";
    const genderValue = formData.get("genderRestriction") as string;
    await createGate({
      branchId: session.branch.id,
      name: (formData.get("name") as string).trim(),
      genderRestriction:
        genderValue === "male" ? "male" : genderValue === "female" ? "female" : null,
      deviceUrl: (formData.get("deviceUrl") as string).trim(),
      deviceUsername: (formData.get("deviceUsername") as string).trim(),
      devicePassword: (formData.get("devicePassword") as string),
      lockNumber: parseInt(formData.get("lockNumber") as string, 10) || 1,
      enabled: formData.get("enabled") === "on",
    });
    redirect("/app/settings/gates");
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.settings.gatesTitle}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t.settings.gateAddButton}
        </h1>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          {/* Gate Name */}
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t.settings.gateName} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Men's Entrance"
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
              defaultValue="none"
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
              {t.settings.gateDeviceUrl} <span className="text-red-500">*</span>
            </label>
            <input
              id="deviceUrl"
              name="deviceUrl"
              required
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
              defaultValue="admin"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Device Password */}
          <div className="grid gap-1.5">
            <label htmlFor="devicePassword" className="text-sm font-medium">
              {t.settings.gateDevicePassword} <span className="text-red-500">*</span>
            </label>
            <input
              id="devicePassword"
              name="devicePassword"
              type="password"
              required
              autoComplete="new-password"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
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
              defaultValue={1}
              className="w-24 rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-3">
            <input
              id="enabled"
              name="enabled"
              type="checkbox"
              defaultChecked
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
              {t.settings.gateCreate}
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
    </div>
  );
}
