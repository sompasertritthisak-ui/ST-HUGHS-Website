import Link from "next/link";
import type { DestinationWithRelations } from "@/lib/content";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

export function DestinationCard({ destination, className }: { destination: DestinationWithRelations; className?: string }) {
  const routes = destination.pathways.length;
  return (
    <Link href={`/destinations/${destination.slug}`} className={cn("group flex flex-col justify-between gap-6 border-t border-line pt-5 transition-colors hover:border-route", className)}>
      <div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-gold-soft">{destination.isoCode}</span>
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">{destination.region}</span>
        </div>
        <h3 className="font-display mt-3 text-[2rem] leading-none text-fg">{destination.country}</h3>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted line-clamp-3">{destination.summary}</p>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-fg-muted">{routes > 0 ? `${routes} published route${routes === 1 ? "" : "s"}` : "Routes being confirmed"}</span>
        {destination.verificationStatus !== "VERIFIED" ? <VerificationBadge status={destination.verificationStatus} /> : <span className="text-gold-soft">Explore →</span>}
      </div>
    </Link>
  );
}
