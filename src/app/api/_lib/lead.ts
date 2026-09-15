import "server-only";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";
import { recordAudit } from "@/lib/audit";
import { notifyNewEnquiry, forwardToCrm, type EnquiryNotification } from "@/lib/notify";
import { ConsultationSchema, EnquirySchema, isHoneypotTripped, toFieldErrors, type ConsultationInput, type EnquiryInput } from "@/lib/schemas/enquiry";
import { rateLimited, readBody, validationError } from "./respond";

/**
 * Shared implementation for POST /api/enquiries and POST /api/consultations.
 *
 * Order of operations (deliberate):
 *   1. rate limit per IP (5 per hour, shared key so a bot cannot double-dip)
 *   2. parse body (JSON or form)
 *   3. honeypot → quiet 200 (bots learn nothing)
 *   4. Zod validation → 422 with field errors
 *   5. resolve slugs / campaign to ids (unknown values are ignored, never echoed)
 *   6. create Enquiry (+ Consultation)
 *   7. analytics + audit (best effort)
 *   8. notify + CRM after the response (best effort, never blocks)
 *   9. 201 { ok, id } — nothing else from the record is returned
 */

export const LEAD_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 } as const;

type Kind = "ENQUIRY" | "CONSULTATION";

/** Run after the response is sent when inside a Next request scope; otherwise fire-and-forget. */
function runAfterResponse(task: () => Promise<unknown>) {
  const safe = () => task().catch((error) => console.error("lead.after failed", error));
  try {
    after(safe);
  } catch {
    void safe();
  }
}

async function resolveReferences(input: { programmeSlug?: string; destinationSlug?: string; utmCampaign?: string }) {
  const [programme, destination, campaign] = await Promise.all([
    input.programmeSlug
      ? prisma.programme.findUnique({ where: { slug: input.programmeSlug }, select: { id: true, slug: true, title: true, status: true } })
      : null,
    input.destinationSlug
      ? prisma.destination.findUnique({ where: { slug: input.destinationSlug }, select: { id: true, slug: true, country: true, status: true } })
      : null,
    input.utmCampaign ? prisma.campaign.findUnique({ where: { utmCampaign: input.utmCampaign }, select: { id: true, isActive: true } }) : null,
  ]);
  return {
    programme: programme && programme.status === "PUBLISHED" ? programme : null,
    destination: destination && destination.status === "PUBLISHED" ? destination : null,
    campaign: campaign ?? null,
  };
}

export async function handleLeadSubmission(req: Request, kind: Kind) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`enquiry:${ip}`, LEAD_RATE_LIMIT.limit, LEAD_RATE_LIMIT.windowMs);
  if (!rl.ok) return rateLimited(rl.retryAfterMs);

  const raw = await readBody(req);
  if (raw === null) return validationError({ _form: ["Invalid request body"] }, 400);

  if (isHoneypotTripped(raw)) {
    // Quiet success: do not store, do not reveal the trap.
    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const schema = kind === "CONSULTATION" ? ConsultationSchema : EnquirySchema;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return validationError(toFieldErrors(parsed.error), 422);

  const data = parsed.data;
  const refs = await resolveReferences(data);
  const type = kind === "CONSULTATION" ? "CONSULTATION" : (data as EnquiryInput).type;

  const enquiry = await prisma.enquiry.create({
    data: {
      type,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      country: data.country ?? null,
      audience: data.audience,
      currentQualification: data.currentQualification ?? null,
      programmeId: refs.programme?.id ?? null,
      destinationId: refs.destination?.id ?? null,
      message: data.message ?? null,
      source: data.source ?? (kind === "CONSULTATION" ? "consultation-form" : "enquiry-form"),
      referrer: data.referrer ?? null,
      utmSource: data.utmSource ?? null,
      utmMedium: data.utmMedium ?? null,
      utmCampaign: data.utmCampaign ?? null,
      campaignId: refs.campaign?.id ?? null,
      consentMarketing: data.consentMarketing,
      status: "NEW",
    },
    select: { id: true, createdAt: true },
  });

  let consultation: EnquiryNotification["consultation"] = null;
  if (kind === "CONSULTATION") {
    const c = data as ConsultationInput;
    await prisma.consultation.create({
      data: {
        enquiryId: enquiry.id,
        preferredDate: new Date(`${c.preferredDate}T00:00:00.000Z`),
        preferredTime: c.preferredTime,
        mode: c.mode,
      },
    });
    consultation = { preferredDate: c.preferredDate, preferredTime: c.preferredTime, mode: c.mode };
  }

  const pathwaySlug = kind === "CONSULTATION" ? ((data as ConsultationInput).pathwaySlug ?? null) : null;

  // Analytics and audit are best effort — a reporting failure must not lose a lead.
  await Promise.allSettled([
    trackEvent({
      name: kind === "CONSULTATION" ? "consultation_requested" : "enquiry_submitted",
      path: kind === "CONSULTATION" ? "/consultation" : "/enquire",
      props: {
        programme: refs.programme?.slug ?? "",
        destination: refs.destination?.slug ?? "",
        audience: data.audience,
        type,
        ...(pathwaySlug ? { pathway: pathwaySlug } : {}),
      },
      sessionId: data.sessionId,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      referrer: data.referrer,
    }).catch((error) => console.error("lead.track failed", error)),
    recordAudit({
      actorId: null,
      action: "CREATE",
      entityType: "Enquiry",
      entityId: enquiry.id,
      // Structural fields only — no personal data in the audit trail.
      afterJson: JSON.stringify({
        type,
        audience: data.audience,
        programmeId: refs.programme?.id ?? null,
        destinationId: refs.destination?.id ?? null,
        campaignId: refs.campaign?.id ?? null,
        source: data.source ?? null,
        consultation,
      }),
      ip,
    }),
  ]);

  const notification: EnquiryNotification = {
    id: enquiry.id,
    type,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    country: data.country ?? null,
    audience: data.audience,
    currentQualification: data.currentQualification ?? null,
    programme: refs.programme ? { slug: refs.programme.slug, title: refs.programme.title } : null,
    destination: refs.destination ? { slug: refs.destination.slug, country: refs.destination.country } : null,
    pathwaySlug,
    message: data.message ?? null,
    source: data.source ?? null,
    referrer: data.referrer ?? null,
    utmSource: data.utmSource ?? null,
    utmMedium: data.utmMedium ?? null,
    utmCampaign: data.utmCampaign ?? null,
    consentMarketing: data.consentMarketing,
    consultation,
    createdAt: enquiry.createdAt.toISOString(),
  };
  runAfterResponse(() => Promise.allSettled([notifyNewEnquiry(notification), forwardToCrm(notification)]));

  return NextResponse.json({ ok: true, id: enquiry.id }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
