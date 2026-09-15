"use client";

import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { AUDIENCES, AUDIENCE_LABELS } from "@/lib/enums";
import { t } from "@/lib/i18n";
import type { LeadForm } from "./use-lead-form";

export type ProgrammeOption = { slug: string; title: string; shortTitle?: string | null };
export type DestinationOption = { slug: string; country: string };

export const LEAD_FIELD_ORDER = ["name", "email", "phone", "country", "audience", "currentQualification", "programmeSlug", "destinationSlug", "message"] as const;

export const LEAD_FIELD_LABELS: Record<string, string> = {
  name: t("forms.name"),
  email: t("forms.email"),
  phone: t("forms.phone"),
  country: t("forms.country"),
  audience: t("forms.audience"),
  currentQualification: t("forms.currentQualification"),
  programmeSlug: t("forms.programme"),
  destinationSlug: t("forms.destination"),
  message: t("forms.message"),
  consentMarketing: t("forms.consentMarketing"),
  preferredDate: t("forms.preferredDate"),
  preferredTime: t("forms.preferredTime"),
  mode: t("forms.mode"),
};

/**
 * The fields shared by the enquiry and consultation forms.
 * Programme/destination options are passed in by the server page (published only).
 */
export function LeadFields({ form, programmes, destinations, messageHint }: { form: LeadForm; programmes: ProgrammeOption[]; destinations: DestinationOption[]; messageHint: string }) {
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label={t("forms.name")} htmlFor={form.fieldId("name")} error={form.firstError("name")} required>
          <Input {...form.fieldProps("name")} type="text" autoComplete="name" required maxLength={120} />
        </Field>
        <Field label={t("forms.email")} htmlFor={form.fieldId("email")} error={form.firstError("email")} required>
          <Input {...form.fieldProps("email")} type="email" inputMode="email" autoComplete="email" required maxLength={200} />
        </Field>
        <Field label={t("forms.phone")} htmlFor={form.fieldId("phone")} hint={t("forms.phone.hint")} error={form.firstError("phone")}>
          <Input {...form.fieldProps("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="+856 20 …" maxLength={25} />
        </Field>
        <Field label={t("forms.country")} htmlFor={form.fieldId("country")} error={form.firstError("country")}>
          <Input {...form.fieldProps("country")} type="text" autoComplete="country-name" maxLength={80} />
        </Field>
        <Field label={t("forms.audience")} htmlFor={form.fieldId("audience")} error={form.firstError("audience")} required>
          <Select {...form.fieldProps("audience")} required>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABELS[a]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("forms.currentQualification")} htmlFor={form.fieldId("currentQualification")} hint={t("forms.currentQualification.hint")} error={form.firstError("currentQualification")}>
          <Input {...form.fieldProps("currentQualification")} type="text" maxLength={200} />
        </Field>
        <Field label={t("forms.programme")} htmlFor={form.fieldId("programmeSlug")} error={form.firstError("programmeSlug")}>
          <Select {...form.fieldProps("programmeSlug")}>
            <option value="">{t("forms.programme.any")}</option>
            {programmes.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.shortTitle ?? p.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("forms.destination")} htmlFor={form.fieldId("destinationSlug")} error={form.firstError("destinationSlug")}>
          <Select {...form.fieldProps("destinationSlug")}>
            <option value="">{t("forms.destination.any")}</option>
            {destinations.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.country}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t("forms.message")} htmlFor={form.fieldId("message")} hint={messageHint} error={form.firstError("message")}>
        <Textarea {...form.fieldProps("message")} maxLength={2000} rows={5} />
      </Field>
    </>
  );
}
