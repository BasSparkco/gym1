import { getBranch } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { BranchDetailView } from "@/components/branches/branch-detail-view";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilLine } from "lucide-react";

type Props = {
  params: Promise<{ branchId: string }>;
};

export default async function BranchDetailPage({ params }: Props) {
  const { branchId } = await params;
  const session = await requireSession();
  const t = await getT();
  const branch = await getBranch(branchId);
  const canManage = session.role === "owner" || session.role === "manager";

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.branches}
        title={
          <span className="flex items-center gap-3">
            {branch.name}
            <Badge tone={branch.status === "active" ? "success" : "neutral"}>
              {branch.status === "active" ? t.status.active : t.status.inactive}
            </Badge>
          </span>
        }
        actions={
          <>
            {canManage && (
              <Button
                href={`/app/branches/${branch.id}/edit`}
                variant="primary"
                icon={<PencilLine className="h-4 w-4" strokeWidth={2} />}
              >
                {t.branches.editBranchBtn}
              </Button>
            )}
            <Button href="/app/branches" variant="secondary">
              {t.branches.allBranches}
            </Button>
          </>
        }
      />

      <BranchDetailView branch={branch} canManage={canManage} t={t} />
    </div>
  );
}
