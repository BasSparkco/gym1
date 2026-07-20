import type { ElementType, ReactNode } from "react";
import { cn } from "./cn";

type CardProps = {
  as?: ElementType;
  hoverable?: boolean;
  animate?: boolean;
  delay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  children?: ReactNode;
  [key: string]: unknown;
};

const staggerClass = ["", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5", "stagger-6"];

export function Card({
  as: As = "article",
  hoverable = false,
  animate = false,
  delay = 0,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <As
      className={cn(
        "rounded-[18px] border border-line bg-surface px-6 py-5 shadow-[0_16px_32px_-24px_rgba(var(--shadow-tint),0.55)] transition-all duration-200",
        hoverable &&
          "hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_16px_36px_-16px_rgba(var(--shadow-tint),0.35)]",
        animate && "animate-fade-in-up",
        animate && staggerClass[delay],
        className,
      )}
      {...props}
    >
      {children}
    </As>
  );
}
