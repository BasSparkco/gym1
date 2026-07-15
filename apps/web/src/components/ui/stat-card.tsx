import type { ReactNode } from "react";
import { cn } from "./cn";

export function StatCard({
  icon,
  label,
  value,
  helper,
  tone = "bg-surface",
  delay = 0,
  className,
}: {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  tone?: string;
  delay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const staggerClass = ["", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5", "stagger-6"][delay];

  return (
    <article
      className={cn(
        "group animate-fade-in-up rounded-[1.75rem] border border-line px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-16px_rgba(86,57,28,0.22)]",
        tone,
        staggerClass,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground/60">{label}</p>
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-brand transition-transform duration-200 group-hover:scale-110">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
      {helper && <p className="mt-3 text-sm leading-6 text-foreground/65">{helper}</p>}
    </article>
  );
}
