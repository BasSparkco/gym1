import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-[0_8px_20px_-6px_rgba(31,111,95,0.55)] hover:bg-brand-strong hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-8px_rgba(31,111,95,0.6)] active:translate-y-0 active:shadow-[0_6px_14px_-6px_rgba(31,111,95,0.5)]",
  secondary:
    "border border-line bg-white hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-[0_10px_24px_-10px_rgba(86,57,28,0.25)] active:translate-y-0",
  ghost:
    "text-foreground/70 hover:bg-black/[0.04] hover:text-foreground",
  danger:
    "border border-danger/25 bg-danger/[0.06] text-danger hover:-translate-y-0.5 hover:bg-danger/10 hover:shadow-[0_10px_24px_-10px_rgba(166,61,64,0.3)] active:translate-y-0",
  dark:
    "bg-white text-brand-strong shadow-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3 text-base",
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof CommonProps> & {
    href: ComponentPropsWithoutRef<typeof Link>["href"];
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  trailingIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...rest}>
        {icon}
        {children}
        {trailingIcon}
      </Link>
    );
  }

  const rest = props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      {icon}
      {children}
      {trailingIcon}
    </button>
  );
}

export function IconButton({
  as: As = "button",
  className,
  children,
  ...props
}: {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
  [key: string]: unknown;
}) {
  return (
    <As
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-current transition-all duration-200 hover:bg-black/[0.06] active:scale-95",
        className,
      )}
      {...props}
    >
      {children}
    </As>
  );
}
