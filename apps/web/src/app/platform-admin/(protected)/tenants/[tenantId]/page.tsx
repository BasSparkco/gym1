import {
  listBranches,
  listTenants,
  pauseTenant,
  resumeTenant,
  updateBranch,
  updateTenantName,
} from "@/lib/platform-admin";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Pause, Play, Plus, Save } from "lucide-react";
import { notFound, redirect } from "next/navigation";

function errorMessageFrom(err: unknown): string {
  let message = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(message) as { message?: string };
    if (parsed.message) message = parsed.message;
  } catch {
    // not JSON, use as-is
  }
  return message;
}

export default async function EditTenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { tenantId } = await params;
  const { error } = await searchParams;
  const tenants = await listTenants();
  const tenant = tenants.find((t) => t.id === tenantId);

  if (!tenant) {
    notFound();
  }

  const branches = await listBranches(tenantId);

  async function handleUpdateBranch(branchId: string, formData: FormData) {
    "use server";

    const input = {
      branch: {
        name: String(formData.get("name") ?? ""),
        address: String(formData.get("address") ?? "") || undefined,
        phone: String(formData.get("phone") ?? "") || undefined,
        countryCode: String(formData.get("countryCode") ?? "") || undefined,
        operatingCurrencyCode: String(formData.get("currency") ?? "") || undefined,
      },
      owner: {
        name: String(formData.get("ownerName") ?? "") || undefined,
        email: String(formData.get("ownerEmail") ?? "") || undefined,
      },
    };

    try {
      await updateBranch(tenantId, branchId, input);
    } catch (err) {
      redirect(
        `/platform-admin/tenants/${tenantId}?error=${encodeURIComponent(errorMessageFrom(err))}`,
      );
    }

    redirect(`/platform-admin/tenants/${tenantId}`);
  }

  async function handleSave(formData: FormData) {
    "use server";
    await updateTenantName(tenantId, String(formData.get("name") ?? ""));
    redirect("/platform-admin");
  }

  async function handlePause(formData: FormData) {
    "use server";
    await pauseTenant(tenantId, String(formData.get("reason") ?? ""));
    redirect(`/platform-admin/tenants/${tenantId}`);
  }

  async function handleResume() {
    "use server";
    await resumeTenant(tenantId);
    redirect(`/platform-admin/tenants/${tenantId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Onboarding"
        title={tenant.name}
        description={`${tenant.branchCount} branch${tenant.branchCount === 1 ? "" : "es"}${tenant.ownerEmail ? ` · Owner: ${tenant.ownerEmail}` : ""}`}
      />

      {error && (
        <section className="animate-scale-in rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {decodeURIComponent(error)}
        </section>
      )}

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleSave} className="grid gap-6">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Organization name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={tenant.name}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" icon={<Save className="h-4 w-4" strokeWidth={2} />}>
              Save changes
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <h2 className="text-sm font-semibold">Service status</h2>

        {tenant.status === "paused" ? (
          <div className="mt-4 grid gap-4">
            <div className="rounded-2xl border border-danger/25 bg-danger/[0.06] px-4 py-3 text-sm text-danger">
              <p className="font-semibold">Paused{tenant.pausedAt ? ` · ${new Date(tenant.pausedAt).toLocaleString()}` : ""}</p>
              <p className="mt-1">{tenant.pausedReason}</p>
            </div>
            <form action={handleResume}>
              <Button type="submit" variant="primary" icon={<Play className="h-4 w-4" strokeWidth={2} />}>
                Resume organization
              </Button>
            </form>
          </div>
        ) : (
          <form action={handlePause} className="mt-4 grid gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for pausing
              </label>
              <textarea
                id="reason"
                name="reason"
                required
                rows={3}
                placeholder="e.g. outstanding invoice, contract ended..."
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <Button type="submit" variant="danger" icon={<Pause className="h-4 w-4" strokeWidth={2} />}>
                Pause organization
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Branches</h2>
          <Button
            variant="secondary"
            size="sm"
            href={`/platform-admin/tenants/${tenantId}/branches/new`}
            icon={<Plus className="h-4 w-4" strokeWidth={2} />}
          >
            Add branch
          </Button>
        </div>

        <div className="mt-4 grid gap-4">
          {branches.map((branch) => (
            <form
              key={branch.id}
              action={handleUpdateBranch.bind(null, branch.id)}
              className="grid gap-4 rounded-2xl border border-line bg-white px-4 py-4"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{branch.name}</p>
                {branch.status === "inactive" ? (
                  <span className="rounded-full border border-line bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/60">
                    Inactive
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor={`name-${branch.id}`} className="text-xs font-medium text-foreground/70">
                    Branch name
                  </label>
                  <input
                    id={`name-${branch.id}`}
                    name="name"
                    type="text"
                    required
                    defaultValue={branch.name}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={`address-${branch.id}`} className="text-xs font-medium text-foreground/70">
                    Address
                  </label>
                  <input
                    id={`address-${branch.id}`}
                    name="address"
                    type="text"
                    defaultValue={branch.address ?? ""}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={`phone-${branch.id}`} className="text-xs font-medium text-foreground/70">
                    Phone
                  </label>
                  <input
                    id={`phone-${branch.id}`}
                    name="phone"
                    type="text"
                    defaultValue={branch.phone ?? ""}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={`countryCode-${branch.id}`} className="text-xs font-medium text-foreground/70">
                    Country code
                  </label>
                  <input
                    id={`countryCode-${branch.id}`}
                    name="countryCode"
                    type="text"
                    maxLength={2}
                    defaultValue={branch.countryCode ?? ""}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={`currency-${branch.id}`} className="text-xs font-medium text-foreground/70">
                    Currency code
                  </label>
                  <input
                    id={`currency-${branch.id}`}
                    name="currency"
                    type="text"
                    maxLength={3}
                    defaultValue={branch.operatingCurrencyCode}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={`ownerName-${branch.id}`} className="text-xs font-medium text-foreground/70">
                    Owner name
                  </label>
                  <input
                    id={`ownerName-${branch.id}`}
                    name="ownerName"
                    type="text"
                    disabled={!branch.ownerEmail}
                    defaultValue={branch.ownerName ?? ""}
                    placeholder={branch.ownerEmail ? undefined : "No owner account"}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-surface-muted disabled:text-foreground/40"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={`ownerEmail-${branch.id}`} className="text-xs font-medium text-foreground/70">
                    Owner email
                  </label>
                  <input
                    id={`ownerEmail-${branch.id}`}
                    name="ownerEmail"
                    type="email"
                    disabled={!branch.ownerEmail}
                    defaultValue={branch.ownerEmail ?? ""}
                    placeholder={branch.ownerEmail ? undefined : "No owner account"}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-surface-muted disabled:text-foreground/40"
                  />
                </div>
              </div>

              <div>
                <Button type="submit" variant="secondary" size="sm" icon={<Save className="h-4 w-4" strokeWidth={2} />}>
                  Save branch
                </Button>
              </div>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
