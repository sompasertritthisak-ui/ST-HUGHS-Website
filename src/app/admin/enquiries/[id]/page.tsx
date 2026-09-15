import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { AUDIENCE_LABELS, CONSULTATION_MODE_LABELS, type Audience, type ConsultationMode } from "@/lib/enums";
import { getEnquiryDetail, listAssignableUsers, resolveAuthors } from "@/lib/admin-ops/enquiries";
import { formatDate, formatDateTime } from "@/lib/utils";
import { EnquiryStatusBadge } from "@/components/ui/verification-badge";
import { Badge } from "@/components/ui/badge";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { Dl, Panel } from "@/components/admin-ops/panel";
import { ENQUIRY_TYPE_LABELS } from "@/components/admin-ops/enquiry-filters";
import { isOverdue } from "@/components/admin-ops/enquiry-board";
import { AssignForm, ConfirmConsultationForm, FollowUpForm, NoteForm, StatusForm } from "@/components/admin-ops/enquiry-detail-forms";

export const metadata: Metadata = { title: "Enquiry · SHV CMS" };
export const dynamic = "force-dynamic";

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, "enquiries.read")) return <AccessDenied area="enquiries" />;

  const { id } = await params;
  const enquiry = await getEnquiryDetail(id);
  if (!enquiry) notFound();

  const [users, authors] = await Promise.all([listAssignableUsers(), resolveAuthors(enquiry.notes.map((n) => n.authorId))]);
  const canUpdate = can(user.role, "enquiries.update");
  const canAssign = can(user.role, "enquiries.assign");
  const overdue = isOverdue(enquiry.followUpAt, enquiry.status);
  const c = enquiry.consultation;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/enquiries" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} /> Back to enquiries
      </Link>
      <PageHeader
        eyebrow={ENQUIRY_TYPE_LABELS[enquiry.type as keyof typeof ENQUIRY_TYPE_LABELS] ?? enquiry.type}
        title={enquiry.name}
        lede={
          <>
            Received <time dateTime={enquiry.createdAt.toISOString()}>{formatDateTime(enquiry.createdAt)}</time> · last updated {formatDateTime(enquiry.updatedAt)}
          </>
        }
        actions={
          <>
            <EnquiryStatusBadge status={enquiry.status} />
            {overdue ? <Badge tone="danger">Follow-up overdue</Badge> : null}
            {c?.confirmedAt ? (
              <Badge tone="success">
                <CheckCircle2 aria-hidden className="size-3" strokeWidth={1.75} /> Consultation confirmed
              </Badge>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          <Panel title="Contact">
            <Dl
              items={[
                { label: "Name", value: enquiry.name },
                { label: "Email", value: <a href={`mailto:${enquiry.email}`} className="underline underline-offset-2">{enquiry.email}</a> },
                { label: "Phone", value: enquiry.phone ? <a href={`tel:${enquiry.phone}`} className="underline underline-offset-2">{enquiry.phone}</a> : null },
                { label: "Country", value: enquiry.country },
                { label: "Audience", value: AUDIENCE_LABELS[enquiry.audience as Audience] ?? enquiry.audience },
                { label: "Qualification", value: enquiry.currentQualification },
                { label: "Marketing consent", value: enquiry.consentMarketing ? "Yes" : "No" },
              ]}
            />
          </Panel>

          <Panel title="Interest">
            <Dl
              items={[
                { label: "Programme", value: enquiry.programme ? <Link href={`/admin/programmes/${enquiry.programme.id}`} className="underline underline-offset-2">{enquiry.programme.title}</Link> : null },
                { label: "Destination", value: enquiry.destination?.country },
                { label: "Message", value: enquiry.message ? <p className="whitespace-pre-wrap">{enquiry.message}</p> : null },
              ]}
            />
          </Panel>

          {c ? (
            <Panel
              title="Consultation request"
              actions={<ConfirmConsultationForm enquiryId={enquiry.id} confirmedAt={c.confirmedAt} disabled={!canUpdate} />}
            >
              <Dl
                items={[
                  { label: "Preferred date", value: c.preferredDate ? formatDate(c.preferredDate) : null },
                  { label: "Preferred time", value: c.preferredTime },
                  { label: "Mode", value: CONSULTATION_MODE_LABELS[c.mode as ConsultationMode] ?? c.mode },
                  { label: "Confirmed", value: c.confirmedAt ? formatDateTime(c.confirmedAt) : <span className="text-warning">Not yet confirmed</span> },
                  { label: "Calendar ref", value: c.calendarRef },
                ]}
              />
            </Panel>
          ) : null}

          <Panel title="Attribution" description="How this person reached the site. Matched to campaigns by utm_campaign.">
            <Dl
              items={[
                { label: "Source path", value: enquiry.source ? <code className="font-mono text-xs">{enquiry.source}</code> : null },
                { label: "Referrer", value: enquiry.referrer ? <code className="break-all font-mono text-xs">{enquiry.referrer}</code> : null },
                { label: "utm_source", value: enquiry.utmSource ? <code className="font-mono text-xs">{enquiry.utmSource}</code> : null },
                { label: "utm_medium", value: enquiry.utmMedium ? <code className="font-mono text-xs">{enquiry.utmMedium}</code> : null },
                { label: "utm_campaign", value: enquiry.utmCampaign ? <code className="font-mono text-xs">{enquiry.utmCampaign}</code> : null },
                { label: "Campaign", value: enquiry.campaign ? <Link href={`/admin/campaigns/${enquiry.campaign.id}`} className="underline underline-offset-2">{enquiry.campaign.name}</Link> : null },
              ]}
            />
          </Panel>

          <Panel title="Notes" description={`${enquiry.notes.length} internal note${enquiry.notes.length === 1 ? "" : "s"}. Never shown publicly.`}>
            <NoteForm enquiryId={enquiry.id} disabled={!canUpdate} />
            <ol className="mt-5 flex flex-col gap-3 border-t border-line pt-4" aria-label="Notes timeline">
              {enquiry.notes.length === 0 ? <li className="text-sm text-fg-subtle">No notes yet.</li> : null}
              {enquiry.notes.map((n) => (
                <li key={n.id} className="relative border-l border-route pl-4">
                  <p className="text-xs text-fg-muted">
                    <span className="font-medium text-fg">{(n.authorId && authors.get(n.authorId)) || "Unknown user"}</span> · <time dateTime={n.createdAt.toISOString()}>{formatDateTime(n.createdAt)}</time>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-fg">{n.body}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <aside className="flex flex-col gap-4" aria-label="Actions">
          <Panel title="Pipeline">
            <StatusForm enquiryId={enquiry.id} status={enquiry.status} disabled={!canUpdate} />
          </Panel>
          <Panel title="Counsellor">
            <AssignForm enquiryId={enquiry.id} assignedToId={enquiry.assignedToId} users={users} disabled={!canAssign} />
            {enquiry.assignedTo ? <p className="mt-2 text-xs text-fg-muted">Currently: {enquiry.assignedTo.name} ({enquiry.assignedTo.email})</p> : null}
          </Panel>
          <Panel title="Follow-up">
            <FollowUpForm enquiryId={enquiry.id} followUpAt={enquiry.followUpAt} disabled={!canUpdate} />
          </Panel>
          <Panel title="Record">
            <Dl
              items={[
                { label: "ID", value: <code className="font-mono text-xs">{enquiry.id}</code> },
                { label: "Audit", value: <Link href={`/admin/audit?entityType=Enquiry&entityId=${enquiry.id}`} className="underline underline-offset-2">View history</Link> },
              ]}
            />
          </Panel>
        </aside>
      </div>
    </div>
  );
}
