import { Badge } from "./badge";
import { VERIFICATION_LABELS, CONTENT_STATUS_LABELS, ENQUIRY_STATUS_LABELS, type VerificationStatus, type ContentStatus, type EnquiryStatus } from "@/lib/enums";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export function VerificationBadge({ status, className }: { status: string; className?: string }) {
  const s = status as VerificationStatus;
  const tone = s === "VERIFIED" ? "success" : s === "PENDING" ? "warning" : "danger";
  const Icon = s === "VERIFIED" ? CheckCircle2 : s === "PENDING" ? Clock : AlertCircle;
  return (
    <Badge tone={tone} className={className}>
      <Icon aria-hidden className="size-3" strokeWidth={1.75} />
      {VERIFICATION_LABELS[s] ?? status}
    </Badge>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = status as ContentStatus;
  const tone = s === "PUBLISHED" ? "success" : s === "APPROVED" ? "accent" : s === "IN_REVIEW" ? "warning" : s === "ARCHIVED" ? "danger" : "neutral";
  return (
    <Badge tone={tone} className={className}>
      {CONTENT_STATUS_LABELS[s] ?? status}
    </Badge>
  );
}

export function EnquiryStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = status as EnquiryStatus;
  const tone = s === "CONVERTED" ? "success" : s === "NEW" ? "gold" : s === "NOT_PROCEEDING" || s === "ARCHIVED" ? "neutral" : "accent";
  return (
    <Badge tone={tone} className={className}>
      {ENQUIRY_STATUS_LABELS[s] ?? status}
    </Badge>
  );
}
