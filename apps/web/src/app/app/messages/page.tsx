"use server";

import { listConversations } from "@/lib/messages";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { MessagesWorkspace } from "@/components/messages/messages-workspace";

export default async function MessagesPage() {
  await requireSession();
  const t = await getT();

  const [conversations, settings] = await Promise.all([listConversations(), getSettings()]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.messages}
        title={t.messages.title}
        description={t.messages.contactUsDescription}
      />

      <MessagesWorkspace conversations={conversations} dateFormat={dateFormat} t={t} />
    </div>
  );
}
