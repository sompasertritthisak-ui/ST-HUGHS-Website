import { VerificationBadge } from "@/components/ui/verification-badge";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Calm empty state for a single field. Never lorem, never an invented fact. */
export function PendingLine({ children = "Confirmed by the admissions team", className }: { children?: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 text-[0.9375rem] text-fg-subtle", className)}>
      <span aria-hidden className="h-px w-6 shrink-0 bg-line-strong" />
      {children}
    </p>
  );
}

/** Renders a text or markdown field, or the pending line when empty. */
export function Prose({ text, markdown = false, pending, className }: { text?: string | null; markdown?: boolean; pending?: ReactNode; className?: string }) {
  if (!text || !text.trim()) return <PendingLine className={className}>{pending}</PendingLine>;
  if (markdown) return <Markdown className={className}>{text}</Markdown>;
  return (
    <div className={cn("max-w-[68ch] space-y-4 text-[1.0625rem] leading-relaxed text-fg-muted", className)}>
      {text
        .split(/\n{2,}/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para, i) => (
          <p key={i}>{para}</p>
        ))}
    </div>
  );
}

/** Verification badge plus footnote — only when the record is not VERIFIED. */
export function VerificationNote({ status, className }: { status: string; className?: string }) {
  if (status === "VERIFIED") return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <VerificationBadge status={status} />
      <p className="text-sm text-fg-subtle">Verification pending: details are being confirmed with the partner before publication.</p>
    </div>
  );
}

/** Discreet provenance line. */
export function SourceNote({ note, className }: { note?: string | null; className?: string }) {
  if (!note) return null;
  return (
    <p className={cn("font-mono text-[0.6875rem] leading-relaxed tracking-[0.06em] text-fg-subtle", className)}>
      <span className="uppercase tracking-[0.14em]">Source</span> <span className="text-fg-subtle/90">{note}</span>
    </p>
  );
}
