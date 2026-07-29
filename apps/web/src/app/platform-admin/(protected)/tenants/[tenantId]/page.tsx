import { listTenants, updateTenantName } from "@/lib/platform-admin";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { notFound, redirect } from "next/navigation";

export default async function EditTenantPage({
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

  async function handleSave(formData: FormData) {
    "use server";
    await updateTenantName(tenantId, String(formData.get("name") ?? ""));
    redirect("/platform-admin");
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Onboarding"
        title={tenant.name}
        description={`${tenant.branchCount} branch${tenant.branchCount === 1 ? "" : "es"}${tenant.ownerEmail ? ` · Owner: ${tenant.ownerEmail}` : ""}`}
      />

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
    </div>
  );
}
