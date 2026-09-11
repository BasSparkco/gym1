"use server";

import { getMember, getMemberPhotoUrl } from "@/lib/members";
import { listBranches } from "@/lib/branches";
import { listAreas } from "@/lib/areas";
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

type Props = {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditMemberPage({ params, searchParams }: Props) {
  const { memberId } = await params;
  const { error } = await searchParams;
  await requireSession();
  const t = await getT();
  const [member, branches, areas, employees, settings] = await Promise.all([
    getMember(memberId),
    listBranches(),
    listAreas(),
    listEmployees(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";
  const currentPhotoUrl = getMemberPhotoUrl(member.pictureUrl);

  async function handleUpdate(formData: FormData) {
    "use server";
    try {
      await updateMemberAction(formData);
    } catch (err) {
      let message = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(message) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // not JSON, use as-is
      }
      redirect(`/app/members/${memberId}/edit?error=${encodeURIComponent(message)}`);
    }
    redirect(`/app/members/${memberId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.members}
        title={t.members.editMember}
        description={`${member.fullName} · ${member.memberNumber}`}
      />

      {error && (
        <section className="animate-scale-in rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {decodeURIComponent(error)}
        </section>
      )}

      <MemberEditForm
        member={member}
        photoUrl={currentPhotoUrl}
        branches={branches}
        areas={areas}
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
