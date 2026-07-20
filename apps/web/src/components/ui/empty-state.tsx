import type { ReactNode } from "react";
import { cn } from "./cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-line bg-surface-muted px-6 py-12 text-center animate-fade-in",
        className,
      )}
    >
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-brand/10 text-brand">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-foreground/70">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-foreground/50">{description}</p>
      )}
      {action}
    </div>
  );
}
