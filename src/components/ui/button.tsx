import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 font-medium tracking-[0.01em] rounded-[var(--radius-sm)] transition-[background-color,color,border-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none whitespace-nowrap max-w-full";

const variants: Record<Variant, string> = {
  primary: "bg-gold text-ink hover:bg-gold-soft border border-transparent",
  secondary: "border border-line-strong text-fg hover:border-fg hover:bg-fg/5",
  ghost: "text-fg hover:text-gold-soft px-0 whitespace-normal text-left",
  danger: "bg-danger text-white hover:bg-danger/90 border border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[0.9375rem]",
  lg: "h-14 px-8 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  arrow?: "right" | "external" | "none";
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

type ButtonAsButton = CommonProps & ComponentPropsWithoutRef<"button"> & { href?: undefined };
type ButtonAsLink = CommonProps & Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", arrow = "none", children, className, disabled, ...rest } = props;
  const classes = cn(base, variants[variant], variant === "ghost" ? "h-auto" : sizes[size], className);
  const Icon = arrow === "external" ? ArrowUpRight : arrow === "right" ? ArrowRight : null;
  const icon = Icon ? (
    <Icon
      aria-hidden
      className="size-4 transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 data-[dir=right]:group-hover:translate-y-0"
      data-dir={arrow}
      strokeWidth={1.75}
    />
  ) : null;

  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...linkRest } = rest as ButtonAsLink;
    const external = /^https?:\/\//.test(href);
    if (disabled) {
      return (
        <span aria-disabled="true" className={cn(classes, "pointer-events-none opacity-50")}>
          {children}
          {icon}
        </span>
      );
    }
    if (external) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...(linkRest as ComponentPropsWithoutRef<"a">)}>
          {children}
          {icon}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...linkRest}>
        {children}
        {icon}
      </Link>
    );
  }
  const { type = "button", ...buttonRest } = rest as ButtonAsButton;
  return (
    <button type={type} className={classes} disabled={disabled} {...buttonRest}>
      {children}
      {icon}
    </button>
  );
}
