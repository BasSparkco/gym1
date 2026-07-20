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
  accent: "bg-accent/20 text-accent-ink",
  success: "bg-accent/15 text-accent-ink ring-1 ring-inset ring-accent-strong/30",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  danger: "bg-danger/10 text-danger ring-1 ring-inset ring-danger/20",
  info: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  neutral: "bg-surface-muted text-foreground/60",
  outline: "border border-line bg-surface text-foreground/60",
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
