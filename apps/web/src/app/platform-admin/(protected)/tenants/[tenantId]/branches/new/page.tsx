import { addBranch, listTenants } from "@/lib/platform-admin";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { notFound, redirect } from "next/navigation";

export default async function NewBranchPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const tenants = await listTenants();
  const tenant = tenants.find((t) => t.id === tenantId);

  if (!tenant) {
    notFound();
  }

  async function handleCreate(formData: FormData) {
    "use server";

    await addBranch(tenantId, {
      branch: {
        name: String(formData.get("branchName") ?? ""),
        address: String(formData.get("branchAddress") ?? "") || undefined,
        phone: String(formData.get("branchPhone") ?? "") || undefined,
        countryCode: String(formData.get("branchCountryCode") ?? "") || undefined,
        operatingCurrencyCode:
          String(formData.get("branchCurrency") ?? "") || undefined,
      },
      owner: {
        name: String(formData.get("ownerName") ?? ""),
        email: String(formData.get("ownerEmail") ?? ""),
        username: String(formData.get("ownerUsername") ?? ""),
        password: String(formData.get("ownerPassword") ?? ""),
      },
    });

    redirect(`/platform-admin/tenants/${tenantId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={tenant.name}
        title="New branch"
        description="Adds another branch to this organization, with its own owner login."
      />

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-8">
          <div className="grid gap-4">
            <p className="text-base font-semibold">Branch</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="branchName" className="text-sm font-medium">
                  Branch name
                </label>
                <input
                  id="branchName"
                  name="branchName"
                  type="text"
                  required
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="branchPhone" className="text-sm font-medium">
                  Phone
                </label>
                <input
                  id="branchPhone"
                  name="branchPhone"
                  type="text"
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <label htmlFor="branchAddress" className="text-sm font-medium">
                  Address
                </label>
                <input
                  id="branchAddress"
                  name="branchAddress"
                  type="text"
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="branchCountryCode" className="text-sm font-medium">
                  Country code
                </label>
                <input
                  id="branchCountryCode"
                  name="branchCountryCode"
                  type="text"
                  placeholder="IL"
                  maxLength={2}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="branchCurrency" className="text-sm font-medium">
                  Currency code
                </label>
                <input
                  id="branchCurrency"
                  name="branchCurrency"
                  type="text"
                  placeholder="ILS"
                  maxLength={3}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-line" />

          <div className="grid gap-4">
            <p className="text-base font-semibold">Owner account</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="ownerName" className="text-sm font-medium">
                  Full name
                </label>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  required
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="ownerEmail" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="ownerEmail"
                  name="ownerEmail"
                  type="email"
                  required
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="ownerUsername" className="text-sm font-medium">
                  Username
                </label>
                <input
                  id="ownerUsername"
                  name="ownerUsername"
                  type="text"
                  required
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="ownerPassword" className="text-sm font-medium">
                  Password
                </label>
                <input
                  id="ownerPassword"
                  name="ownerPassword"
                  type="password"
                  required
                  minLength={6}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<Save className="h-4 w-4" strokeWidth={2} />}>
              Add branch
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
