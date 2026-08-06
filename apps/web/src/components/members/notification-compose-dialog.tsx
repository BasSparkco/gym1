"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Dict } from "@/lib/i18n";

export function NotificationComposeDialog({
  open,
  onClose,
  memberId,
  memberName,
  t,
}: {
  open: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  t: Dict;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/members/${memberId}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setSubject("");
      setBody("");
    } catch {
      setError(t.messages.notificationSendError);
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setSent(false);
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} title={`${t.members.sendNotification} — ${memberName}`}>
      <div className="grid gap-4 px-5 py-5">
        {sent ? (
          <p className="rounded-xl border border-line bg-surface-muted px-4 py-3 text-sm text-foreground">
            {t.messages.notificationSent}
          </p>
        ) : (
          <>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">{t.messages.notificationSubjectLabel}</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t.messages.notificationSubjectPlaceholder}
                className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">{t.messages.notificationBodyLabel}</label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t.messages.notificationBodyPlaceholder}
                className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          {sent ? (
            <Button type="button" variant="secondary" onClick={handleClose}>
              {t.messages.close}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              disabled={sending || !subject.trim() || !body.trim()}
              onClick={() => void handleSend()}
              icon={<Send className="h-3.5 w-3.5" strokeWidth={2} />}
            >
              {t.messages.notificationSendButton}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
