"use client";

import { apiBaseUrl } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function PlatformAdminSignOutButton({ name }: { name: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignOut() {
    setIsSubmitting(true);

    try {
      await fetch(`${apiBaseUrl}/platform-admin/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/platform-admin/login");
      router.refresh();
      setIsSubmitting(false);
    }
  }

  return (
    <button
      className="group flex items-center gap-3 rounded-full border border-line bg-white px-4 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      onClick={handleSignOut}
      disabled={isSubmitting}
    >
      <span className="block text-sm font-medium text-foreground">{name}</span>
      <LogOut
        className="h-4 w-4 shrink-0 text-foreground/40 transition-colors group-hover:text-brand"
        strokeWidth={2}
      />
    </button>
  );
}
