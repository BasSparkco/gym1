"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { cn } from "@/components/ui/cn";
import { MessageThreadPanel } from "@/components/messages/message-thread-panel";
import { isRtlText } from "@/components/members/member-profile-shared";
import { formatDateTime } from "@/lib/date-format";
import type { Dict } from "@/lib/i18n";
import type { Conversation } from "@/lib/messages";
import type { DateFormat } from "@/lib/settings";

const RECENT_SEARCHES_KEY = "gym.messages.recentSearches";
const MAX_RECENT_SEARCHES = 6;

export function MessagesWorkspace({
  conversations,
  activeMemberId,
  activeMemberName,
  dateFormat,
  t,
}: {
  conversations: Conversation[];
  /** Set when arriving from a member profile's "Send message" link — opens that member's thread inline right away. */
  activeMemberId?: string;
  /** Needed to render a placeholder row when the member has no conversation yet. */
  activeMemberName?: string;
  dateFormat: DateFormat;
  t: Dict;
}) {
  const router = useRouter();
  const [openMemberId, setOpenMemberId] = useState<string | null>(activeMemberId ?? null);
  const [unreadOverrides, setUnreadOverrides] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

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

  const sortedItems = useMemo(
    () => items.slice().sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)),
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sortedItems;
    return sortedItems.filter(
      (c) => c.memberName.toLowerCase().includes(q) || c.memberNumber.toLowerCase().includes(q),
    );
  }, [sortedItems, searchTerm]);

  const activeConversation = sortedItems.find((c) => c.memberId === openMemberId) ?? null;

  function selectConversation(memberId: string) {
    setOpenMemberId(memberId);
    setUnreadOverrides((prev) => ({ ...prev, [memberId]: 0 }));
    router.push(`/app/messages/${memberId}`);
  }

  function goBack() {
    setOpenMemberId(null);
    router.push("/app/messages");
  }

  function commitSearch() {
    const q = searchTerm.trim();
    if (!q) return;
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
      try {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable — recent searches just won't persist
      }
      return next;
    });
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    try {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <div className="grid h-[calc(100vh-260px)] min-h-[560px] grid-cols-1 overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_16px_32px_-24px_rgba(var(--shadow-tint),0.55)] md:grid-cols-[340px_1fr]">
      {/* Sidebar */}
      <div
        className={cn(
          "min-h-0 flex-col border-line md:flex md:border-e",
          openMemberId ? "hidden" : "flex",
        )}
      >
        <div className="shrink-0 border-b border-line p-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35"
              strokeWidth={2}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSearch();
              }}
              onBlur={commitSearch}
              placeholder={t.messages.searchConversationsPlaceholder}
              className="w-full rounded-full border border-line bg-surface-muted/60 py-2 ps-9 pe-4 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>

          {recentSearches.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-xs text-foreground/40">{t.messages.recentSearches}:</span>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSearchTerm(term)}
                  className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-foreground/70 transition-colors hover:bg-brand/10 hover:text-brand"
                >
                  {term}
                </button>
              ))}
              <button
                type="button"
                onClick={clearRecentSearches}
                className="ms-auto shrink-0 text-xs font-medium text-brand hover:underline"
              >
                {t.messages.clearAll}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-foreground/50">
              {searchTerm.trim() ? t.messages.noSearchResults : t.messages.noConversations}
            </p>
          ) : (
            filteredItems.map((c) => {
              const isOpen = openMemberId === c.memberId;
              const unreadCount = unreadOverrides[c.memberId] ?? c.unreadCount;

              return (
                <button
                  key={c.memberId}
                  type="button"
                  onClick={() => selectConversation(c.memberId)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-line/60 px-4 py-3 text-start transition-colors hover:bg-black/[0.02]",
                    isOpen && "bg-brand/[0.06]",
                  )}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <WhatsAppIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        dir={isRtlText(c.memberName) ? "rtl" : undefined}
                        className="truncate text-sm font-medium"
                      >
                        {c.memberName}
                      </p>
                      {c.lastMessageBody && (
                        <span className="shrink-0 text-[11px] text-foreground/40">
                          {formatDateTime(c.lastMessageAt, dateFormat).split(" ")[0]}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-sm text-foreground/55">
                        {c.lastMessageBody || t.messages.noMessagesYet}
                      </p>
                      {unreadCount > 0 && <Badge className="!bg-brand !text-on-brand shrink-0">{unreadCount}</Badge>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={cn("min-h-0 flex-col md:flex", openMemberId ? "flex" : "hidden md:flex")}>
        {activeConversation ? (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-3">
              <button
                type="button"
                onClick={goBack}
                aria-label={t.messages.backToChats}
                className="-ms-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/60 hover:bg-black/[0.04] md:hidden"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <WhatsAppIcon className="h-4 w-4" />
              </div>
              <p
                dir={isRtlText(activeConversation.memberName) ? "rtl" : undefined}
                className="min-w-0 truncate text-sm font-semibold"
              >
                {activeConversation.memberName}
              </p>
            </div>
            <MessageThreadPanel
              key={activeConversation.memberId}
              memberId={activeConversation.memberId}
              t={t}
              onSent={() => setUnreadOverrides((prev) => ({ ...prev, [activeConversation.memberId]: 0 }))}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
              <WhatsAppIcon className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-foreground/70">{t.messages.selectConversationTitle}</p>
            <p className="max-w-xs text-xs text-foreground/45">{t.messages.selectConversationHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
