"use server";

import { listGates, updateGate, deleteGate } from "@/lib/gates";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Save, Trash2, ChevronLeft } from "lucide-react";

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

  // Mirrors GatesSettingsPage's scoping: an owner viewing all branches can
  // land here from any branch's gate card, not just their currently active
  // one — but a manager stays confined to their single branch either way.
  const settings = await getSettings();
  const viewingAllBranches = session.role === "owner" && settings.ownerDataScope === "all";
  const gates = viewingAllBranches ? await listGates() : await listGates(session.branch.id);
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
      linkDeviceSerial: (formData.get("linkDeviceSerial") as string).trim() || null,
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
      <PageHeader
        eyebrow={t.settings.gatesTitle}
        title={gate.name}
        actions={
          <Button href="/app/settings/gates" variant="secondary" icon={<ChevronLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />}>
            {t.settings.gatesTitle}
          </Button>
        }
      />

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

          {/* BAS-IP Link device serial (Network > Management system log channel) */}
          <div className="grid gap-1.5">
            <label htmlFor="linkDeviceSerial" className="text-sm font-medium">
              Link device serial
            </label>
            <input
              id="linkDeviceSerial"
              name="linkDeviceSerial"
              defaultValue={gate.linkDeviceSerial ?? ""}
              placeholder="e.g. b81b5f1a-0cd7-43d5-9166-f72ac4edadf5"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-mono outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="text-xs text-foreground/50">
              Serial number this device reports when it logs into our BAS-IP Link
              receiver (Network → Management system on the device). Used to attribute
              access-log events to this gate. See gates.md.
            </p>
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
            <Button type="submit" variant="primary" icon={<Save className="h-4 w-4" strokeWidth={2} />}>
              {t.settings.gateUpdate}
            </Button>
            <Button href="/app/settings/gates" variant="secondary">
              {t.actions.cancel}
            </Button>
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
            <Button type="submit" variant="danger" icon={<Trash2 className="h-4 w-4" strokeWidth={2} />}>
              {t.settings.gateDelete}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
