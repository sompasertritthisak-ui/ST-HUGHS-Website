import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Programme } from "@prisma/client";
import { PROGRAMME_TYPE_LABELS, type ProgrammeType } from "@/lib/enums";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

export function ProgrammeCard({ programme, className, index }: { programme: Programme; className?: string; index?: number }) {
  const typeLabel = PROGRAMME_TYPE_LABELS[programme.type as ProgrammeType] ?? programme.type;
  return (
    <Link
      href={`/programmes/${programme.slug}`}
      className={cn(
        "group relative flex flex-col justify-between gap-8 border-t border-line pt-6 transition-colors duration-[var(--dur)] hover:border-route",
        className,
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-4">
          <span className="eyebrow">
            {typeof index === "number" ? <span className="tabular text-fg-subtle">{String(index + 1).padStart(2, "0")}</span> : null}
            {typeLabel}
            {programme.awardingBody ? <span className="text-fg-subtle">· {programme.awardingBody}</span> : null}
          </span>
          {programme.verificationStatus !== "VERIFIED" ? <VerificationBadge status={programme.verificationStatus} /> : null}
        </div>
        <h3 className="font-display mt-4 text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.05] text-fg text-balance">{programme.shortTitle ?? programme.title}</h3>
        <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-fg-muted">{programme.summary}</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 font-mono text-[0.6875rem] uppercase tracking-[0.12em]">
        <div>
          <dt className="text-fg-subtle">Duration</dt>
          <dd className="mt-1 normal-case tracking-normal text-fg">{programme.durationLabel ?? "Confirmed per intake"}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">English</dt>
          <dd className="mt-1 normal-case tracking-normal text-fg">{programme.englishRequirement ? programme.englishRequirement.replace(/\s*\(per NCUK\)\.?$/, "") : "Confirmed per intake"}</dd>
        </div>
      </dl>
      <span className="inline-flex items-center gap-2 text-sm text-gold-soft">
        View programme
        <ArrowRight aria-hidden className="size-4 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-1" strokeWidth={1.5} />
      </span>
    </Link>
  );
}
