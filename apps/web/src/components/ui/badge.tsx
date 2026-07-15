import type { ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone =
  | "brand"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "outline";

const tones: Record<BadgeTone, string> = {
  brand: "bg-brand/10 text-brand",
  accent: "bg-accent/10 text-accent",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-600",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-gray-100 text-gray-500",
  outline: "border border-line bg-white text-foreground/60",
};

export function Badge({
  tone = "neutral",
  icon,
  className,
  children,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
