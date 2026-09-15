"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { apiBaseUrl } from "@/lib/auth";

const POLL_INTERVAL_MS = 5000;
const POPUP_WIDTH = 260;
const MARGIN = 16;

type LatestVisit = {
  id: string;
  checkInTime: string;
  member: { id: string; fullName: string; pictureUrl: string | null };
};

function memberPhotoUrl(pictureUrl: string | null): string | null {
  if (!pictureUrl) return null;
  const apiRoot = apiBaseUrl.replace(/\/api$/, "");
  return `${apiRoot}${pictureUrl}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function LastCheckinPopup({ title, closeLabel }: { title: string; closeLabel: string }) {
  const [visit, setVisit] = useState<LatestVisit | null>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const lastIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Polls for the newest check-in rather than opening a socket — matches the
  // MessagesBell unread-count pattern elsewhere in the shell. The first
  // response only establishes a baseline (so opening the app doesn't pop up
  // whatever check-in already happened earlier); only a later id change
  // triggers the popup.
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/visits/latest");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { visit: LatestVisit | null };
        const latest = data.visit;
        if (!latest) return;

        if (!initializedRef.current) {
          initializedRef.current = true;
          lastIdRef.current = latest.id;
          return;
        }

        if (latest.id !== lastIdRef.current) {
          lastIdRef.current = latest.id;
          setVisit(latest);
          setVisible(true);
        }
      } catch {
        // transient poll failure — next tick retries
      }
    }

    void poll();
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Default corner: right side for LTR, left side for RTL — only computed
  // once per mount so a manually dragged position survives closing and a
  // later check-in reopening the same popup.
  useEffect(() => {
    if (!visible || position) return;
    const isRtl = document.documentElement.dir === "rtl";
    const height = containerRef.current?.offsetHeight ?? 140;
    const x = isRtl ? MARGIN : window.innerWidth - POPUP_WIDTH - MARGIN;
    const y = window.innerHeight - height - MARGIN;
    setPosition({ x, y });
  }, [visible, position]);

  function handleDragStart(e: React.PointerEvent<HTMLDivElement>) {
    if (!position) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const width = containerRef.current?.offsetWidth ?? POPUP_WIDTH;
    const height = containerRef.current?.offsetHeight ?? 140;
    const nextX = Math.min(
      Math.max(dragRef.current.originX + (e.clientX - dragRef.current.startX), 0),
      window.innerWidth - width,
    );
    const nextY = Math.min(
      Math.max(dragRef.current.originY + (e.clientY - dragRef.current.startY), 0),
      window.innerHeight - height,
    );
    setPosition({ x: nextX, y: nextY });
  }

  function handleDragEnd() {
    dragRef.current = null;
  }

  if (!visible || !visit) return null;

  const photoUrl = memberPhotoUrl(visit.member.pictureUrl);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        left: position?.x ?? 0,
        top: position?.y ?? 0,
        width: POPUP_WIDTH,
        visibility: position ? "visible" : "hidden",
      }}
      className="z-50 select-none overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
    >
      <div
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        className="flex cursor-grab items-center justify-between gap-2 bg-brand/10 px-3 py-2 active:cursor-grabbing"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">{title}</span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setVisible(false)}
          aria-label={closeLabel}
          title={closeLabel}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-white hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      <div className="flex items-center gap-3 px-3 py-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-line" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand ring-1 ring-line">
            {initials(visit.member.fullName)}
          </div>
        )}
        <p className="min-w-0 truncate text-sm font-semibold">{visit.member.fullName}</p>
      </div>
    </div>
  );
}
