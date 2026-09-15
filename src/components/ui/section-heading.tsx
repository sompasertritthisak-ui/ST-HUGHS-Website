import { cn } from "@/lib/utils";
import { Eyebrow } from "./eyebrow";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
  level = 2,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  className?: string;
  level?: 1 | 2 | 3;
  children?: ReactNode;
}) {
  const Tag = (`h${level}` as unknown) as "h2";
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow className={cn("mb-5", align === "center" && "justify-center")}>{eyebrow}</Eyebrow> : null}
      <Tag
        className={cn(
          "font-display text-fg text-balance",
          level === 1 ? "text-[clamp(2.75rem,7vw,5.5rem)]" : level === 2 ? "text-[clamp(2.25rem,4.6vw,3.75rem)]" : "text-[clamp(1.75rem,3vw,2.5rem)]",
        )}
      >
        {title}
      </Tag>
      {lede ? <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted text-pretty">{lede}</p> : null}
      {children}
    </div>
  );
}
