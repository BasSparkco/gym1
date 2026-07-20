import type { ReactNode } from "react";
import { cn } from "./cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-fade-in-up",
        className,
      )}
    >
      <div>
        {eyebrow && (
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground/70">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </section>
  );
}
