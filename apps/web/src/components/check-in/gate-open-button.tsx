"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Lock, XCircle } from "lucide-react";

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
          "flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold shadow-sm transition-all duration-200 disabled:pointer-events-none disabled:opacity-60",
          state === "ok"
            ? "bg-green-500 text-white"
            : state === "fail"
              ? "bg-red-500 text-white"
              : "border-2 border-brand bg-white text-brand hover:-translate-y-0.5 hover:bg-brand hover:text-white hover:shadow-md active:translate-y-0",
        ].join(" ")}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
        ) : state === "ok" ? (
          <CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />
        ) : state === "fail" ? (
          <XCircle className="h-5 w-5" strokeWidth={2.2} />
        ) : (
          <Lock className="h-4 w-4" strokeWidth={2.2} />
        )}
        {state === "ok" ? successLabel : state === "fail" ? failLabel : label}
      </button>
      {state === "fail" && failReason && failReason !== failLabel && (
        <p className="animate-fade-in-up text-xs text-red-600">{failReason}</p>
      )}
    </div>
  );
}
