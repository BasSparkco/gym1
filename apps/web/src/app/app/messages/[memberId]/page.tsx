"use server";

import { listConversations } from "@/lib/messages";
import { getMember } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { ConversationsList } from "@/components/messages/conversations-list";

type Props = { params: Promise<{ memberId: string }> };

export default async function MemberMessagesPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [conversations, member] = await Promise.all([listConversations(), getMember(memberId)]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.messages}
        title={t.messages.title}
        description={t.messages.contactUsDescription}
      />

      <ConversationsList
        conversations={conversations}
        activeMemberId={member.id}
        activeMemberName={member.fullName}
        t={t}
      />
    </div>
  );
}
