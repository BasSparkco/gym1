"use client";

import { useState } from "react";

type Props = {
  label: string;
  successLabel: string;
  failLabel: string;
  gateId?: string;
};

export function GateOpenButton({ label, successLabel, failLabel, gateId }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [failReason, setFailReason] = useState("");

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch("/api/access/gate/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gateId ? { gateId } : {}),
      });
      const data = (await res.json()) as { opened?: boolean; reason?: string };
      if (data.opened) {
        setState("ok");
        setTimeout(() => setState("idle"), 3000);
      } else {
        setFailReason(data.reason ?? failLabel);
        setState("fail");
        setTimeout(() => setState("idle"), 4000);
      }
    } catch {
      setFailReason(failLabel);
      setState("fail");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  const isLoading = state === "loading";

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={[
          "flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition",
          state === "ok"
            ? "bg-green-500 text-white"
            : state === "fail"
              ? "bg-red-500 text-white"
              : "border-2 border-brand bg-white text-brand hover:bg-brand hover:text-white disabled:opacity-60",
        ].join(" ")}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : state === "ok" ? (
          <span className="text-lg">✓</span>
        ) : state === "fail" ? (
          <span className="text-lg">✕</span>
        ) : (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        )}
        {state === "ok" ? successLabel : state === "fail" ? failLabel : label}
      </button>
      {state === "fail" && failReason && failReason !== failLabel && (
        <p className="text-xs text-red-600">{failReason}</p>
      )}
    </div>
  );
}
