"use server";

import { listConversations } from "@/lib/messages";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConversationsList } from "@/components/messages/conversations-list";
import { MessageCircle } from "lucide-react";

export default async function MessagesPage() {
  await requireSession();
  const t = await getT();

  const conversations = await listConversations();

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.messages}
        title={t.messages.title}
        description={t.messages.contactUsDescription}
      />

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-5 w-5" strokeWidth={2} />}
          title={t.messages.noConversations}
        />
      ) : (
        <ConversationsList conversations={conversations} t={t} />
      )}
    </div>
  );
}
