"use client";

import { apiBaseUrl } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, Lock, Mail } from "lucide-react";

export function PlatformAdminSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/platform-admin/auth/sign-in`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string | string[] }
          | null;
        const message = Array.isArray(payload?.message)
          ? payload.message[0]
          : payload?.message;

        setErrorMessage(message ?? "Unable to sign in with those credentials.");
        return;
      }

      router.push("/platform-admin");
      router.refresh();
    } catch {
      setErrorMessage("The API is unavailable. Start the backend and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-10 grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35"
            strokeWidth={2}
          />
          <input
            className="w-full rounded-[10px] border border-line bg-surface py-3 pl-11 pr-4 outline-none transition-all duration-200 focus:border-brand focus:ring-2 focus:ring-brand/20"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
          />
        </div>
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Password
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
        {isSubmitting ? "Signing in…" : "Continue"}
      </button>
    </form>
  );
}
