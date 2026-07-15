"use server";

import { getBranch, updateBranch } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { apiBaseUrl } from "@/lib/auth";
import { redirect } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";
import { CURRENCIES } from "@/lib/currencies";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import LogoUpload from "@/components/logo-upload";
import { Save } from "lucide-react";

type Props = {
  params: Promise<{ branchId: string }>;
};

export default async function EditBranchPage({ params }: Props) {
  const { branchId } = await params;
  await requireSession();
  const t = await getT();
  const [branch, settings] = await Promise.all([getBranch(branchId), getSettings()]);

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateBranch(branchId, {
      name: (formData.get("name") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      countryCode: (formData.get("countryCode") as string) || undefined,
      operatingCurrencyCode:
        (formData.get("operatingCurrencyCode") as string) || undefined,
      status: formData.get("status") as "active" | "inactive",
    });
    redirect(`/app/branches/${branchId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.branches}
        title={t.branches.editBranch}
        description={branch.name}
      />

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleUpdate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t.branches.branchName} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={branch.name}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="address" className="text-sm font-medium">
              {t.branches.address}
            </label>
            <input
              id="address"
              name="address"
              defaultValue={branch.address ?? ""}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="phone" className="text-sm font-medium">
              {t.branches.phone}
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={branch.phone ?? ""}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="countryCode" className="text-sm font-medium">
              {t.branches.country}
            </label>
            <select
              id="countryCode"
              name="countryCode"
              defaultValue={branch.countryCode ?? ""}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">— Select country —</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} (+{c.dialCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="operatingCurrencyCode" className="text-sm font-medium">
              {t.branches.currency}
            </label>
            <select
              id="operatingCurrencyCode"
              name="operatingCurrencyCode"
              defaultValue={branch.operatingCurrencyCode}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="status" className="text-sm font-medium">
              {t.branches.statusLabel}
            </label>
            <select
              id="status"
              name="status"
              defaultValue={branch.status}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="active">{t.status.active}</option>
              <option value="inactive">{t.status.inactive}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<Save className="h-4 w-4" strokeWidth={2} />}>
              {t.actions.saveChanges}
            </Button>
            <Button href={`/app/branches/${branchId}`} variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>

      {settings.logoMode === "perBranch" && (
        <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.branches.branchLogo}
          </p>
          <p className="mt-1 text-xs text-foreground/60">{t.branches.branchLogoHelp}</p>
          <div className="mt-4">
            <LogoUpload
              apiBaseUrl={apiBaseUrl}
              endpoint={`/branches/${branchId}/logo`}
              currentLogoUrl={branch.logoUrl ?? null}
              labels={{
                upload: t.settings.logoUpload,
                change: t.settings.logoChange,
                remove: t.settings.logoRemove,
                uploading: t.settings.logoUploading,
                error: t.settings.logoUploadError,
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
}
