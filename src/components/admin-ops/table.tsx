import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Dense admin table. Wrap in `<Table>`; use `<Th>` / `<Td>` for cells. */
export function Table({ className, children, caption, ...props }: ComponentPropsWithoutRef<"table"> & { caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-line bg-bg-raised shadow-sm">
      <table className={cn("w-full border-collapse text-sm text-fg", className)} {...props}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export function Th({ className, children, ...props }: ComponentPropsWithoutRef<"th">) {
  return (
    <th scope="col" className={cn("whitespace-nowrap border-b border-line bg-bg-hover/60 px-3 py-2 text-left font-mono text-[0.6875rem] font-normal uppercase tracking-[0.14em] text-fg-muted", className)} {...props}>
      {children}
    </th>
  );
}

export function Td({ className, children, ...props }: ComponentPropsWithoutRef<"td">) {
  return (
    <td className={cn("border-b border-line px-3 py-2 align-top", className)} {...props}>
      {children}
    </td>
  );
}

export function Tr({ className, ...props }: ComponentPropsWithoutRef<"tr">) {
  return <tr className={cn("transition-colors hover:bg-bg-hover/50 last:[&>td]:border-b-0", className)} {...props} />;
}

/** Column header that toggles ?sort=&dir= while preserving other params. */
export function SortableTh({ label, field, current, dir, params }: { label: string; field: string; current?: string; dir?: "asc" | "desc"; params: Record<string, string | undefined> }) {
  const active = current === field;
  const nextDir = active && dir === "asc" ? "desc" : "asc";
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
  u.set("sort", field);
  u.set("dir", nextDir);
  u.delete("page");
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Th aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <Link href={`?${u.toString()}`} className={cn("inline-flex items-center gap-1 hover:text-fg", active && "text-fg")}>
        {label}
        <Icon aria-hidden className="size-3" strokeWidth={1.75} />
      </Link>
    </Th>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-10 text-center text-sm text-fg-muted">
        {children}
      </td>
    </tr>
  );
}
