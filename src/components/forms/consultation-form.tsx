"use client";

import { useMemo } from "react";
import { Field, Input, Select } from "@/components/ui/field";
import { CONSULTATION_MODES, CONSULTATION_MODE_LABELS, AudienceSchema, ConsultationModeSchema } from "@/lib/enum-schemas";
import { ConsultationSchema, CONSULTATION_TIME_SLOTS, todayIsoDate } from "@/lib/schemas/enquiry";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLeadForm } from "./use-lead-form";
import { LeadFields, LEAD_FIELD_LABELS, LEAD_FIELD_ORDER, type DestinationOption, type ProgrammeOption } from "./lead-fields";
import { ConsentField, ErrorSummary, FormError, Honeypot, PrivacyLine, SubmitRow, SuccessPanel } from "./lead-form-parts";

export type ConsultationFormDefaults = {
  programmeSlug?: string;
  destinationSlug?: string;
  pathwaySlug?: string;
  audience?: string;
  mode?: string;
};

export type ConsultationFormProps = {
  programmes: ProgrammeOption[];
  destinations: DestinationOption[];
  defaults?: ConsultationFormDefaults;
  /** Optional context line, e.g. the pathway the visitor came from. */
  context?: { label: string; title: string } | null;
  whatsappHref?: string | null;
  endpoint?: string;
  source?: string;
  className?: string;
};

const FIELD_ORDER = [...LEAD_FIELD_ORDER, "preferredDate", "preferredTime", "mode", "consentMarketing"] as const;

/**
 * Consultation booking form. Same transport as EnquiryForm (plain fetch to
 * /api/consultations). Designed to hand off to a calendar/CRM later: the
 * preferred date, slot and mode are structured, not free text.
 */
export function ConsultationForm({ programmes, destinations, defaults, context, whatsappHref, endpoint = "/api/consultations", source = "consultation-form", className }: ConsultationFormProps) {
  const minDate = useMemo(() => todayIsoDate(), []);

  const initial = useMemo(() => {
    const audience = AudienceSchema.safeParse(defaults?.audience?.toUpperCase());
    const mode = ConsultationModeSchema.safeParse(defaults?.mode?.toUpperCase());
    return {
      name: "",
      email: "",
      phone: "",
      country: "",
      audience: audience.success ? audience.data : "STUDENT",
      currentQualification: "",
      programmeSlug: programmes.some((p) => p.slug === defaults?.programmeSlug) ? (defaults?.programmeSlug as string) : "",
      destinationSlug: destinations.some((d) => d.slug === defaults?.destinationSlug) ? (defaults?.destinationSlug as string) : "",
      pathwaySlug: defaults?.pathwaySlug ?? "",
      message: "",
      preferredDate: "",
      preferredTime: "",
      mode: mode.success ? mode.data : "IN_PERSON",
      consentMarketing: false,
      website: "",
    };
  }, [defaults, programmes, destinations]);

  const form = useLeadForm({ schema: ConsultationSchema, endpoint, idPrefix: "consultation", fieldOrder: FIELD_ORDER, initial, source });

  if (form.isSuccess) {
    return <SuccessPanel title={t("forms.success.consultation.title")} id={form.resultId} whatsappHref={whatsappHref} className={className} />;
  }

  return (
    <form onSubmit={form.submit} noValidate className={cn("relative flex flex-col gap-6", className)} aria-describedby="consultation-privacy">
      <Honeypot form={form} />
      <input type="hidden" name="pathwaySlug" value={String(form.values.pathwaySlug ?? "")} />
      {context ? (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-l border-brand pl-4">
          <span className="eyebrow">{context.label}</span>
          <span className="text-fg">{context.title}</span>
        </p>
      ) : null}
      <ErrorSummary form={form} labels={LEAD_FIELD_LABELS} />
      <FormError message={form.formError} />
      <LeadFields form={form} programmes={programmes} destinations={destinations} messageHint={t("forms.message.consultation.hint")} />

      <fieldset className="grid gap-5 border-t border-line pt-6 md:grid-cols-3">
        <legend className="eyebrow eyebrow-rule mb-5 w-full">{t("forms.preferredDate")}</legend>
        <Field label={t("forms.preferredDate")} htmlFor={form.fieldId("preferredDate")} error={form.firstError("preferredDate")} required>
          <Input {...form.fieldProps("preferredDate")} type="date" min={minDate} required />
        </Field>
        <Field label={t("forms.preferredTime")} htmlFor={form.fieldId("preferredTime")} error={form.firstError("preferredTime")} required>
          <Select {...form.fieldProps("preferredTime")} required>
            <option value="">{t("forms.preferredTime.placeholder")}</option>
            {CONSULTATION_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("forms.mode")} htmlFor={form.fieldId("mode")} error={form.firstError("mode")} required>
          <Select {...form.fieldProps("mode")} required>
            {CONSULTATION_MODES.map((m) => (
              <option key={m} value={m}>
                {CONSULTATION_MODE_LABELS[m]}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>

      <ConsentField form={form} />
      <div id="consultation-privacy">
        <PrivacyLine />
      </div>
      <SubmitRow form={form} label={t("forms.submit.consultation")} whatsappHref={whatsappHref} />
    </form>
  );
}
