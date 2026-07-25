"use client";

import type { Branch } from "@/lib/branches";
import type { TenantSettings } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/countries";
import { CURRENCIES } from "@/lib/currencies";
import { apiBaseUrl } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LogoUpload from "@/components/logo-upload";
import { Save } from "lucide-react";

const inputClass =
  "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

// The single canonical shape a branch edit form is built from. Both the
// dedicated /app/branches/[branchId]/edit page and the branches-list inline
// expansion (BranchesGrid) render through this component, so the two never
// drift apart again. `action` differs per caller (redirect-on-save for the
// standalone page vs. revalidate-in-place for the inline panel) but the
// field markup and the update logic it submits to are shared.
type Props = {
  branch: Branch;
  settings: TenantSettings;
  t: Dict;
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  onCancel?: () => void;
};

export function BranchEditForm({ branch, settings, t, action, cancelHref, onCancel }: Props) {
  return (
    <div className="grid gap-4">
      <Card animate className="border-s-4 border-s-brand">
        <form action={action} className="grid gap-5">
          <input type="hidden" name="branchId" value={branch.id} />

          <div className="grid gap-1.5">
            <label htmlFor={`name-${branch.id}`} className="text-sm font-medium">
              {t.branches.branchName} <span className="text-red-500">*</span>
            </label>
            <input
              id={`name-${branch.id}`}
              name="name"
              required
              defaultValue={branch.name}
              className={inputClass}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor={`address-${branch.id}`} className="text-sm font-medium">
              {t.branches.address}
            </label>
            <input
              id={`address-${branch.id}`}
              name="address"
              defaultValue={branch.address ?? ""}
              className={inputClass}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor={`phone-${branch.id}`} className="text-sm font-medium">
              {t.branches.phone}
            </label>
            <input
              id={`phone-${branch.id}`}
              name="phone"
              defaultValue={branch.phone ?? ""}
              className={inputClass}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor={`countryCode-${branch.id}`} className="text-sm font-medium">
              {t.branches.country}
            </label>
            <select
              id={`countryCode-${branch.id}`}
              name="countryCode"
              defaultValue={branch.countryCode ?? ""}
              className={inputClass}
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
            <label htmlFor={`operatingCurrencyCode-${branch.id}`} className="text-sm font-medium">
              {t.branches.currency}
            </label>
            <select
              id={`operatingCurrencyCode-${branch.id}`}
              name="operatingCurrencyCode"
              defaultValue={branch.operatingCurrencyCode}
              className={inputClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor={`status-${branch.id}`} className="text-sm font-medium">
              {t.branches.statusLabel}
            </label>
            <select
              id={`status-${branch.id}`}
              name="status"
              defaultValue={branch.status}
              className={inputClass}
            >
              <option value="active">{t.status.active}</option>
              <option value="inactive">{t.status.inactive}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<Save className="h-4 w-4" strokeWidth={2} />}>
              {t.actions.saveChanges}
            </Button>
            {cancelHref ? (
              <Button href={cancelHref} variant="secondary">
                {t.actions.cancel}
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={onCancel}>
                {t.actions.cancel}
              </Button>
            )}
          </div>
        </form>
      </Card>

      {settings.logoMode === "perBranch" && (
        <Card animate className="border-s-4 border-s-muted">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">{t.branches.branchLogo}</p>
          <p className="mt-1 text-xs text-foreground/60">{t.branches.branchLogoHelp}</p>
          <div className="mt-4">
            <LogoUpload
              apiBaseUrl={apiBaseUrl}
              endpoint={`/branches/${branch.id}/logo`}
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
        </Card>
      )}
    </div>
  );
}
