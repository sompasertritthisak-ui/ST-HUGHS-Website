import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { MediaPreview } from "@/lib/admin/queries";
import { Thumb } from "./media-picker";

export interface MediaCard extends MediaPreview {
  usageStatus: string;
  consentStatus: string;
  sizeBytes: number;
}

const fmtSize = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function MediaGrid({ items }: { items: MediaCard[] }) {
  if (items.length === 0) return <EmptyState title="No media yet" body="Upload photography, logos and PDFs. Every file needs alt text and a usage status before it can be used publicly." />;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {items.map((m) => (
        <li key={m.id}>
          <Link href={`/admin/media/${m.id}`} className="flex flex-col gap-2 rounded-[var(--radius)] border border-line bg-bg-raised p-2 shadow-sm hover:border-line-strong focus-visible:ring-2 focus-visible:ring-ring/60">
            <Thumb item={m} className="aspect-square w-full" />
            <span className="truncate font-mono text-[0.6875rem] text-fg-muted">{m.filename}</span>
            <span className="flex flex-wrap items-center gap-1">
              <Badge tone={m.usageStatus === "APPROVED" ? "success" : m.usageStatus === "RESTRICTED" || m.usageStatus === "EXPIRED" ? "danger" : "neutral"}>{m.usageStatus}</Badge>
              {m.consentStatus !== "NOT_REQUIRED" ? <Badge tone={m.consentStatus === "GRANTED" ? "success" : "warning"}>{m.consentStatus}</Badge> : null}
              {!m.alt ? <Badge tone="warning">No alt</Badge> : null}
            </span>
            <span className="font-mono text-[0.625rem] text-fg-subtle">
              {m.kind} · {fmtSize(m.sizeBytes)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
