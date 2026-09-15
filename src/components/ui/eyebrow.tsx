import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Eyebrow({ children, className, rule = true, as: Tag = "p" }: { children: ReactNode; className?: string; rule?: boolean; as?: "p" | "span" | "div" }) {
  return (
    <Tag className={cn("eyebrow", rule && "eyebrow-rule", className)}>
      {children}
    </Tag>
  );
}
