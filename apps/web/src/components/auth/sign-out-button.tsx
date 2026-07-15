"use client";

import { apiBaseUrl } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

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
        className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-brand-strong shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        onClick={handleSignOut}
        disabled={isSubmitting}
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        {label}
      </button>
    );
  }

  return (
    <button
      className="group flex items-center gap-3 rounded-full border border-line bg-white px-4 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      onClick={handleSignOut}
      disabled={isSubmitting}
    >
      <span>
        <span className="block text-sm font-medium text-foreground">{name}</span>
        <span className="block text-xs uppercase tracking-[0.2em] text-foreground/55">
          {label || role}
        </span>
      </span>
      <LogOut
        className="h-4 w-4 shrink-0 text-foreground/40 transition-colors group-hover:text-brand"
        strokeWidth={2}
      />
    </button>
  );
}