"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

const POLL_INTERVAL_MS = 30_000;

export function MessagesBell({
  label,
  variant = "light",
}: {
  label: string;
  variant?: "light" | "dark";
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchUnreadCount() {
      try {
        const res = await fetch("/api/messages/conversations/unread-count");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { unreadCount: number };
        if (!cancelled) setUnreadCount(data.unreadCount);
      } catch {
        // transient poll failure — next interval tick will retry
      }
    }

    void fetchUnreadCount();
    const interval = setInterval(() => void fetchUnreadCount(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isDark = variant === "dark";

  return (
    <Link
      href="/app/messages"
      aria-label={label}
      className={
        isDark
          ? "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          : "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-black/[0.04] hover:text-foreground"
      }
    >
      <WhatsAppIcon className="h-[18px] w-[18px]" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
