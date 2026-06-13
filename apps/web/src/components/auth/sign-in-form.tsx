"use client";

import { apiBaseUrl } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SignInFormProps = {
  labels: {
    emailOrUsername: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

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
          | { message?: string | string[] }
          | null;
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

  return (
    <form className="mt-10 grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        {labels.emailOrUsername}
        <input
          className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-brand"
          placeholder="frontdesk@sparkgym.local"
          type="text"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          autoComplete="username"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        {labels.password}
        <input
          className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-brand"
          placeholder="Enter your password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>

      {errorMessage ? (
        <p className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}

      <button
        className="mt-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? labels.signingIn : labels.continue}
      </button>
    </form>
  );
}
