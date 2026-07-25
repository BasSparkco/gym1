import { listBranches } from "@/lib/branches";
import { listMembers } from "@/lib/members";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getSettings, getLogoUrl } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { BranchesGrid, type BranchCardData } from "@/components/branches/branches-grid";
import { PlusCircle } from "lucide-react";

export default async function BranchesPage() {
  const session = await requireSession();
  const t = await getT();
  const [branches, settings, members, employees] = await Promise.all([
    listBranches(),
    getSettings(),
    listMembers(),
    listEmployees(),
  ]);
  const canManage = session.role === "owner" || session.role === "manager";
  const sharedLogoUrl = getLogoUrl(settings.logoUrl);

  const branchCards: BranchCardData[] = branches.map((branch) => ({
    branch,
    memberCount: members.filter((m) => m.homeBranchId === branch.id).length,
    staffCount: employees.filter((e) => e.branchId === branch.id).length,
    logoUrl: settings.logoMode === "perBranch" ? getLogoUrl(branch.logoUrl) : sharedLogoUrl,
  }));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.branches}
        title={t.branches.title}
        description={formatDict(t.branches.listDescription, { count: branches.length, plural: branches.length !== 1 ? "es" : "", tenant: session.tenant.name })}
        actions={
          canManage && (
            <Button href="/app/branches/new" variant="primary" icon={<PlusCircle className="h-4 w-4" strokeWidth={2} />}>
              {t.branches.newBranch}
            </Button>
          )
        }
      />

      <BranchesGrid branches={branchCards} settings={settings} canManage={canManage} t={t} />
    </div>
  );
}
