import { getBranch } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { redirect } from "next/navigation";
import { updateBranchAction } from "@/app/app/branches/actions";
import { BranchEditForm } from "@/components/branches/branch-edit-form";
import { PageHeader } from "@/components/ui/page-header";

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
    await updateBranchAction(formData);
    redirect(`/app/branches/${branchId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.branches}
        title={t.branches.editBranch}
        description={branch.name}
      />

      <BranchEditForm
        branch={branch}
        settings={settings}
        t={t}
        action={handleUpdate}
        cancelHref={`/app/branches/${branchId}`}
      />
    </div>
  );
}
