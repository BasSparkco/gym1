"use server";

import { listConversations } from "@/lib/messages";
import { getMember } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { MessagesWorkspace } from "@/components/messages/messages-workspace";

type Props = { params: Promise<{ memberId: string }> };

export default async function MemberMessagesPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [conversations, member, settings] = await Promise.all([
    listConversations(),
    getMember(memberId),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.messages}
        title={t.messages.title}
        description={t.messages.contactUsDescription}
      />

      <MessagesWorkspace
        conversations={conversations}
        activeMemberId={member.id}
        activeMemberName={member.fullName}
        dateFormat={dateFormat}
        t={t}
      />
    </div>
  );
}
