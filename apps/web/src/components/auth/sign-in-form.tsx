"use client";

import { apiBaseUrl } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, Lock, User } from "lucide-react";

type SignInFormProps = {
  labels: {
    email: string;
    password: string;
    continue: string;
    signingIn: string;
  };
};

export function SignInForm({ labels }: SignInFormProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("frontdesk@sparkgym.local");
  const [password, setPassword] = useState("frontdesk123");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pausedReason, setPausedReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setPausedReason(null);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/sign-in`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { code?: string; message?: string | string[]; reason?: string }
          | null;

        if (payload?.code === "TENANT_PAUSED") {
          setPausedReason(payload.reason ?? "No reason given.");
          return;
        }

        const message = Array.isArray(payload?.message)
          ? payload.message[0]
          : payload?.message;

        setErrorMessage(message ?? "Unable to sign in with those credentials.");
        return;
      }

      router.push("/app/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("The API is unavailable. Start the backend on port 3002 and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (pausedReason) {
    return (
      <div className="mt-10 grid gap-4 rounded-2xl border border-danger/25 bg-danger/[0.06] px-5 py-4 text-sm text-danger">
        <p className="font-semibold">This organization has been paused.</p>
        <p>{pausedReason}</p>
        <p className="text-foreground/60">Contact your platform administrator to resolve this.</p>
      </div>
    );
  }

  return (
    <form className="mt-10 grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        {labels.email}
        <div className="relative">
          <User
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35"
            strokeWidth={2}
          />
          <input
            className="w-full rounded-[10px] border border-line bg-surface py-3 pl-11 pr-4 outline-none transition-all duration-200 focus:border-brand focus:ring-2 focus:ring-brand/20"
            placeholder="frontdesk@sparkgym.local"
            type="email"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="email"
          />
        </div>
      </label>

      <label className="grid gap-2 text-sm font-medium">
        {labels.password}
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35"
            strokeWidth={2}
          />
          <input
            className="w-full rounded-[10px] border border-line bg-surface py-3 pl-11 pr-4 outline-none transition-all duration-200 focus:border-brand focus:ring-2 focus:ring-brand/20"
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
      </label>

      {errorMessage ? (
        <p className="animate-fade-in-up flex items-start gap-2 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          {errorMessage}
        </p>
      ) : null}

      <button
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-3 text-sm font-semibold text-brand-strong shadow-[0_8px_20px_-6px_rgba(124,175,35,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-strong hover:shadow-[0_14px_28px_-8px_rgba(124,175,35,0.55)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        )}
        {isSubmitting ? labels.signingIn : labels.continue}
      </button>
    </form>
  );
}
