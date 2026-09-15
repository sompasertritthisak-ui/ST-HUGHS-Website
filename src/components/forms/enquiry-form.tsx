"use client";

import { useMemo } from "react";
import { EnquirySchema } from "@/lib/schemas/enquiry";
import { AudienceSchema } from "@/lib/enums";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLeadForm } from "./use-lead-form";
import { LeadFields, LEAD_FIELD_LABELS, LEAD_FIELD_ORDER, type DestinationOption, type ProgrammeOption } from "./lead-fields";
import { ConsentField, ErrorSummary, FormError, Honeypot, PrivacyLine, SubmitRow, SuccessPanel } from "./lead-form-parts";

export type EnquiryFormDefaults = {
  programmeSlug?: string;
  destinationSlug?: string;
  audience?: string;
  /** "visit" prefills a campus-visit enquiry (type=VISIT). */
  type?: string;
};

export type EnquiryFormProps = {
  programmes: ProgrammeOption[];
  destinations: DestinationOption[];
  defaults?: EnquiryFormDefaults;
  whatsappHref?: string | null;
  endpoint?: string;
  source?: string;
  className?: string;
};

const FIELD_ORDER = [...LEAD_FIELD_ORDER, "consentMarketing"] as const;

function normaliseType(v?: string) {
  const upper = (v ?? "").toUpperCase();
  return upper === "VISIT" || upper === "BROCHURE" ? upper : "ENQUIRY";
}

/**
 * Public enquiry form. Posts JSON to /api/enquiries — no server actions, so it
 * can be embedded in any page or drawer. Options are supplied by the server.
 */
export function EnquiryForm({ programmes, destinations, defaults, whatsappHref, endpoint = "/api/enquiries", source = "enquiry-form", className }: EnquiryFormProps) {
  const initial = useMemo(() => {
    const audience = AudienceSchema.safeParse(defaults?.audience?.toUpperCase());
    return {
      name: "",
      email: "",
      phone: "",
      country: "",
      audience: audience.success ? audience.data : "STUDENT",
      currentQualification: "",
      programmeSlug: programmes.some((p) => p.slug === defaults?.programmeSlug) ? (defaults?.programmeSlug as string) : "",
      destinationSlug: destinations.some((d) => d.slug === defaults?.destinationSlug) ? (defaults?.destinationSlug as string) : "",
      message: "",
      consentMarketing: false,
      website: "",
      type: normaliseType(defaults?.type),
    };
  }, [defaults, programmes, destinations]);

  const form = useLeadForm({ schema: EnquirySchema, endpoint, idPrefix: "enquiry", fieldOrder: FIELD_ORDER, initial, source });

  if (form.isSuccess) {
    return <SuccessPanel title={t("forms.success.enquiry.title")} id={form.resultId} whatsappHref={whatsappHref} className={className} />;
  }

  const isVisit = form.values.type === "VISIT";

  return (
    <form onSubmit={form.submit} noValidate className={cn("relative flex flex-col gap-6", className)} aria-describedby="enquiry-privacy">
      <Honeypot form={form} />
      <input type="hidden" name="type" value={String(form.values.type ?? "ENQUIRY")} />
      {isVisit ? <p className="eyebrow eyebrow-rule">{t("forms.context.visit")}</p> : null}
      <ErrorSummary form={form} labels={LEAD_FIELD_LABELS} />
      <FormError message={form.formError} />
      <LeadFields form={form} programmes={programmes} destinations={destinations} messageHint={t("forms.message.enquiry.hint")} />
      <ConsentField form={form} />
      <div id="enquiry-privacy">
        <PrivacyLine />
      </div>
      <SubmitRow form={form} label={t("forms.submit.enquiry")} whatsappHref={whatsappHref} />
    </form>
  );
}
