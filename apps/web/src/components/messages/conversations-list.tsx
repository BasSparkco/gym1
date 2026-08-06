"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageThreadPanel } from "@/components/messages/message-thread-panel";
import { isRtlText } from "@/components/members/member-profile-shared";
import type { Dict } from "@/lib/i18n";
import type { Conversation } from "@/lib/messages";

export function ConversationsList({
  conversations,
  activeMemberId,
  activeMemberName,
  t,
}: {
  conversations: Conversation[];
  /** Set when arriving from a member profile's "Send message" link — opens that member's thread inline right away. */
  activeMemberId?: string;
  /** Needed to render a placeholder row when the member has no conversation yet. */
  activeMemberName?: string;
  t: Dict;
}) {
  const router = useRouter();
  const [openMemberId, setOpenMemberId] = useState<string | null>(activeMemberId ?? null);
  const [unreadOverrides, setUnreadOverrides] = useState<Record<string, number>>({});

  const items = useMemo(() => {
    if (!activeMemberId || conversations.some((c) => c.memberId === activeMemberId)) {
      return conversations;
    }
    const placeholder: Conversation = {
      memberId: activeMemberId,
      memberName: activeMemberName ?? "",
      memberNumber: "",
      lastMessageBody: "",
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
    };
    return [placeholder, ...conversations];
  }, [conversations, activeMemberId, activeMemberName]);

  function toggle(memberId: string) {
    const next = openMemberId === memberId ? null : memberId;
    setOpenMemberId(next);
    if (next) {
      setUnreadOverrides((prev) => ({ ...prev, [memberId]: 0 }));
      router.push(`/app/messages/${memberId}`);
    } else {
      router.push("/app/messages");
    }
  }

  return (
    <div className="grid gap-3">
      {items
        .slice()
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
        .map((c, index) => {
          const isOpen = openMemberId === c.memberId;
          const unreadCount = unreadOverrides[c.memberId] ?? c.unreadCount;

          return (
            <Card key={c.memberId} animate delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6} className="!bg-white !p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(c.memberId)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start transition-colors hover:bg-black/[0.02]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <MessageCircle className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p dir={isRtlText(c.memberName) ? "rtl" : undefined} className="text-sm font-medium">
                      {c.memberName}
                    </p>
                    <p className="mt-1 truncate text-sm text-foreground/60">
                      {c.lastMessageBody || t.messages.noMessagesYet}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {unreadCount > 0 && <Badge tone="danger">{unreadCount}</Badge>}
                  {c.lastMessageBody && (
                    <span className="text-xs text-foreground/40">
                      {new Date(c.lastMessageAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </button>

              {isOpen && (
                <MessageThreadPanel
                  key={c.memberId}
                  memberId={c.memberId}
                  t={t}
                  onSent={() => setUnreadOverrides((prev) => ({ ...prev, [c.memberId]: 0 }))}
                />
              )}
            </Card>
          );
        })}
    </div>
  );
}
