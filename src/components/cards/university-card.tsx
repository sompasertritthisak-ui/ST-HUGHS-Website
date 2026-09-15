import Link from "next/link";
import Image from "next/image";
import type { Media, University, Destination } from "@prisma/client";
import { PARTNERSHIP_TYPE_LABELS, type PartnershipType } from "@/lib/enums";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function UniversityCard({ university, className }: { university: University & { logo?: Media | null; destination?: Destination | null }; className?: string }) {
  const logo = university.logo && university.logo.usageStatus === "APPROVED" ? university.logo : null;
  return (
    <Link href={`/universities/${university.slug}`} className={cn("group surface-raised flex flex-col gap-5 rounded-[var(--radius)] p-6 transition-colors hover:border-line-strong", className)}>
      <div className="flex h-12 items-center">
        {logo ? (
          <Image src={logo.url} alt={logo.alt || university.name} width={logo.width ?? 160} height={logo.height ?? 48} className="max-h-12 w-auto object-contain" />
        ) : (
          <span className="font-display text-[1.5rem] leading-tight text-fg">{university.name}</span>
        )}
      </div>
      {logo ? <p className="text-[1.0625rem] font-medium text-fg">{university.name}</p> : null}
      <p className="text-sm text-fg-muted">
        {[university.city, university.destination?.country].filter(Boolean).join(", ")}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Badge tone="gold">{PARTNERSHIP_TYPE_LABELS[university.partnershipType as PartnershipType] ?? university.partnershipType}</Badge>
        {university.verificationStatus !== "VERIFIED" ? <VerificationBadge status={university.verificationStatus} /> : null}
      </div>
    </Link>
  );
}
