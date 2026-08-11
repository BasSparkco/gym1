"use server";

import { getMember, getMemberPhotoUrl } from "@/lib/members";
import { listBranches } from "@/lib/branches";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { MemberEditForm } from "@/components/members/member-edit-form";
import { updateMemberAction } from "@/app/app/members/actions";
import { Save } from "lucide-react";

type Props = { params: Promise<{ memberId: string }> };

export default async function EditMemberPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();
  const [member, branches, employees, settings] = await Promise.all([
    getMember(memberId),
    listBranches(),
    listEmployees(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";
  const currentPhotoUrl = getMemberPhotoUrl(member.pictureUrl);

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateMemberAction(formData);
    redirect(`/app/members/${memberId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.members}
        title={t.members.editMember}
        description={`${member.fullName} · ${member.memberNumber}`}
      />

      <MemberEditForm
        member={member}
        photoUrl={currentPhotoUrl}
        branches={branches}
        employees={employees}
        dateFormat={dateFormat}
        t={t}
        action={handleUpdate}
        submitIcon={<Save className="h-4 w-4" strokeWidth={2} />}
        footer={
          <Button href={`/app/members/${memberId}`} variant="secondary">
            {t.actions.cancel}
          </Button>
        }
      />
    </div>
  );
}
