import { listTenants } from "@/lib/platform-admin";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function PlatformAdminDashboardPage() {
  const tenants = await listTenants();

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Tenants"
        description="Every gym running on this platform. Create a new one to onboard a customer."
        actions={
          <Button
            variant="primary"
            href="/platform-admin/tenants/new"
            icon={<Plus className="h-4 w-4" strokeWidth={2} />}
          >
            New tenant
          </Button>
        }
      />

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        {tenants.length === 0 ? (
          <p className="text-sm text-foreground/60">No tenants yet.</p>
        ) : (
          <div className="grid gap-3">
            {tenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/platform-admin/tenants/${tenant.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold">{tenant.name}</p>
                  <p className="mt-0.5 text-xs text-foreground/60">
                    {tenant.branchCount} branch{tenant.branchCount === 1 ? "" : "es"}
                    {tenant.ownerEmail ? ` · ${tenant.ownerEmail}` : ""}
                  </p>
                </div>
                <span className="text-xs text-foreground/50">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
