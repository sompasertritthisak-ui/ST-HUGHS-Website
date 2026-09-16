import Link from "next/link";
import type { PathwayWithRelations } from "@/lib/content";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

/** A route card: structure label, the step chain drawn as a gold line, destination. */
export function PathwayCard({ pathway, className }: { pathway: PathwayWithRelations; className?: string }) {
  const steps = pathway.steps.filter((s) => s.label.toLowerCase() !== "career");
  return (
    <Link
      href={`/pathways/${pathway.slug}`}
      className={cn("group surface-raised relative flex flex-col gap-6 rounded-[var(--radius)] p-6 transition-colors duration-[var(--dur)] hover:border-line-strong", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow">{pathway.subjectArea ?? "Pathway"}</span>
          <h3 className="mt-3 text-[1.25rem] font-medium leading-snug text-fg text-balance">{pathway.title}</h3>
        </div>
        {pathway.structureLabel ? (
          <span className="shrink-0 font-display text-[2.25rem] leading-none text-brand-soft tabular">{pathway.structureLabel.replace(/\s+/g, "")}</span>
        ) : null}
      </div>

      <ol className="relative flex items-start justify-between gap-2" aria-label="Route steps">
        <span aria-hidden className="absolute left-2 right-2 top-[3px] h-px bg-route/50" />
        {steps.map((s, i) => (
          <li key={s.id} className="relative flex min-w-0 flex-1 flex-col items-start">
            <span aria-hidden className={cn("relative z-10 size-[7px] rounded-full", i === 0 ? "bg-route shadow-[0_0_10px_var(--route)]" : "bg-fg-muted")} />
            <span className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-fg-subtle">{s.label}</span>
            <span className="line-clamp-2 break-words text-xs leading-tight text-fg-muted">{s.location ?? s.institution ?? ""}</span>
          </li>
        ))}
      </ol>

      <div className="flex items-center justify-between gap-4 border-t border-line pt-4 text-sm">
        <span className="text-fg-muted">
          {pathway.destination?.country ?? "Destination to be confirmed"}
          {pathway.university ? <span className="text-fg-subtle"> · {pathway.university.name}</span> : null}
        </span>
        {pathway.verificationStatus !== "VERIFIED" ? <VerificationBadge status={pathway.verificationStatus} /> : <span className="text-brand-soft">View route →</span>}
      </div>
    </Link>
  );
}
