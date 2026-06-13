"use client";

import { useState, useEffect, useRef } from "react";

export type MemberResult = {
  id: string;
  fullName: string;
  memberNumber: string;
  status: "active" | "inactive";
};

type Props = {
  placeholder: string;
  onSelect: (member: MemberResult) => void;
  onEnterWithoutSelection?: (query: string) => void;
  autoFocus?: boolean;
  inputClassName?: string;
};

export function MemberAutocomplete({
  placeholder,
  onSelect,
  onEnterWithoutSelection,
  autoFocus,
  inputClassName,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(fetchTimer.current);
    if (query.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    fetchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/members/search?q=${encodeURIComponent(query.trim())}`,
        );
        const data = (await res.json()) as { members: MemberResult[] };
        setResults(data.members);
        setOpen(data.members.length > 0);
        setActiveIndex(-1);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, 200);
  }, [query]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (open ? Math.min(i + 1, results.length - 1) : i));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0) {
        e.preventDefault();
        select(results[activeIndex]);
      } else if (!open || activeIndex < 0) {
        onEnterWithoutSelection?.(query);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function select(member: MemberResult) {
    onSelect(member);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        className={
          inputClassName ??
          "w-full rounded-2xl border border-line bg-white px-5 py-4 text-base outline-none transition placeholder:text-foreground/40 focus:border-brand focus:ring-2 focus:ring-brand/20"
        }
      />

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
          {results.map((member, i) => (
            <button
              key={member.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                select(member);
              }}
              className={[
                "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition",
                i === activeIndex
                  ? "bg-brand/10 text-brand"
                  : "hover:bg-brand/5",
                i > 0 ? "border-t border-line" : "",
              ].join(" ")}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand uppercase">
                {member.fullName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{member.fullName}</p>
                <p className="font-mono text-xs text-foreground/50">
                  {member.memberNumber}
                </p>
              </div>
              <span
                className={[
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  member.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500",
                ].join(" ")}
              >
                {member.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
