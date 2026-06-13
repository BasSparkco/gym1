"use client";

import { apiBaseUrl } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SignOutButtonProps = {
  name: string;
  role: string;
  label: string;
};

export function SignOutButton({ name, role, label }: SignOutButtonProps) {
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