"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isRtlText } from "@/components/members/member-profile-shared";
import type { Dict } from "@/lib/i18n";

type ThreadMessage = {
  id: string;
  senderType: "staff" | "member";
  body: string;
  createdAt: string;
};

export function MessageThreadPanel({
  memberId,
  t,
  onSent,
}: {
  memberId: string;
  t: Dict;
  /** Called after a staff message is sent — lets the caller refresh unread counts. */
  onSent?: () => void;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappWarning, setWhatsappWarning] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Polls while the thread is open so a member's WhatsApp reply (captured
  // via the SparkCo inbound webhook, not pushed to this tab) shows up
  // without staff having to close and reopen the conversation — same
  // fallback pattern the SparkCo integration manual recommends for a chat
  // page with no WebSocket.
  useEffect(() => {
    let cancelled = false;

    async function load(showSpinner: boolean) {
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/members/${memberId}/messages`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { messages: ThreadMessage[] };
        if (!cancelled) setMessages(data.messages);
      } catch {
        if (!cancelled && showSpinner) setError(t.messages.loadError);
      } finally {
        if (!cancelled && showSpinner) setLoading(false);
      }
    }

    void load(true);
    const interval = setInterval(() => void load(false), 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    setWhatsappWarning(null);
    try {
      const res = await fetch(`/api/members/${memberId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as {
        message: ThreadMessage;
        whatsapp: { sent: boolean; reason?: string };
      };
      setMessages((prev) => [...prev, data.message]);
      setDraft("");
      if (!data.whatsapp.sent) {
        setWhatsappWarning(
          data.whatsapp.reason ? `${t.messages.whatsappDeliveryFailed} (${data.whatsapp.reason})` : t.messages.whatsappDeliveryFailed,
        );
      }
      onSent?.();
    } catch {
      setError(t.messages.sendError);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="text-sm text-muted">{t.messages.loading}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted">{t.messages.noMessagesYet}</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.senderType === "staff" ? "justify-end" : "justify-start"}`}>
              <div
                dir={isRtlText(m.body) ? "rtl" : undefined}
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.senderType === "staff"
                    ? "bg-brand text-on-brand"
                    : "border border-line bg-surface-muted text-foreground"
                }`}
              >
                {m.body}
              </div>
            </div>
          ))
        )}
      </div>
      {error && <p className="px-5 pb-2 text-xs text-danger">{error}</p>}
      {whatsappWarning && <p className="px-5 pb-2 text-xs text-amber-600">{whatsappWarning}</p>}
      <div className="flex shrink-0 items-end gap-2 border-t border-line px-5 py-4">
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.messages.typeMessagePlaceholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          className="flex-1 resize-none rounded-2xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={sending || !draft.trim()}
          onClick={() => void handleSend()}
          icon={<Send className="h-3.5 w-3.5" strokeWidth={2} />}
        >
          {t.messages.send}
        </Button>
      </div>
    </div>
  );
}
