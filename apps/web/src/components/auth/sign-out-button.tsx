"use client";

import { apiBaseUrl } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SignOutButtonProps = {
  name: string;
  role: string;
  label: string;
  variant?: "card" | "button";
};

export function SignOutButton({ name, role, label, variant = "card" }: SignOutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignOut() {
    setIsSubmitting(true);

    try {
      await fetch(`${apiBaseUrl}/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/signin");
      router.refresh();
      setIsSubmitting(false);
    }
  }

  if (variant === "button") {
    return (
      <button
        className="w-full rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-brand-strong transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        onClick={handleSignOut}
        disabled={isSubmitting}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      className="rounded-full border border-line bg-white px-4 py-2 text-left transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      onClick={handleSignOut}
      disabled={isSubmitting}
    >
      <span className="block text-sm font-medium text-foreground">{name}</span>
      <span className="block text-xs uppercase tracking-[0.2em] text-foreground/55">
        {label || role}
      </span>
    </button>
  );
}