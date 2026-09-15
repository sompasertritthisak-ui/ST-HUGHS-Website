"use client";

import { useActionState, useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import type { ContactSettings, MessagingSettings } from "@/lib/content";
import type { InstitutionSettings } from "@/lib/admin-ops/settings";
import { saveContactSettings, saveInstitutionSettings, saveMessagingSettings } from "@/lib/admin-ops/settings-actions";
import { initialActionState } from "@/lib/admin-ops/types";
import { FormStatus, SubmitButton } from "./form-status";

const compact = "h-10 text-sm";

/** Repeatable list of single-line values submitted as several inputs with the same `name`. */
function StringList({ name, label, initial, placeholder, errors, disabled, type = "text" }: { name: string; label: string; initial: string[]; placeholder?: string; errors?: Record<string, string>; disabled?: boolean; type?: string }) {
  const [items, setItems] = useState<{ key: number; value: string }[]>(() => (initial.length ? initial : [""]).map((v, i) => ({ key: i, value: v })));
  const [nextKey, setNextKey] = useState(initial.length + 1);
  const uid = useId();
  const add = () => {
    setItems((s) => [...s, { key: nextKey, value: "" }]);
    setNextKey((k) => k + 1);
  };
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="text-sm font-medium text-fg">{label}</legend>
      {items.map((it, i) => {
        const err = errors?.[`${name}.${i}`];
        return (
          <div key={it.key} className="flex items-start gap-2">
            <div className="flex-1">
              <label htmlFor={`${uid}-${it.key}`} className="sr-only">
                {label} {i + 1}
              </label>
              <Input id={`${uid}-${it.key}`} name={name} type={type} defaultValue={it.value} placeholder={placeholder} className={compact} aria-invalid={Boolean(err)} />
              {err ? (
                <p role="alert" className="mt-1 text-sm text-danger">
                  {err}
                </p>
              ) : null}
            </div>
            <button type="button" onClick={() => setItems((s) => s.filter((x) => x.key !== it.key))} className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-line-strong text-fg-muted hover:text-danger" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}>
              <Trash2 aria-hidden className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        );
      })}
      <button type="button" onClick={add} className="inline-flex h-9 w-fit items-center gap-1.5 rounded-[var(--radius-sm)] border border-dashed border-line-strong px-3 text-sm text-fg-muted hover:text-fg">
        <Plus aria-hidden className="size-4" strokeWidth={1.75} /> Add {label.toLowerCase().replace(/s$/, "")}
      </button>
    </fieldset>
  );
}

function SaveBar({ canEdit, state }: { canEdit: boolean; state: Parameters<typeof FormStatus>[0]["state"] }) {
  return (
    <div className="flex flex-col gap-3 md:col-span-2">
      {canEdit ? <div><SubmitButton>Save settings</SubmitButton></div> : <p className="text-xs text-fg-muted">Read-only: you need the settings permission to make changes.</p>}
      <FormStatus state={state} />
    </div>
  );
}

export function ContactSettingsForm({ value, canEdit }: { value: ContactSettings; canEdit: boolean }) {
  const [state, action] = useActionState(saveContactSettings, initialActionState);
  const err = state.errors ?? {};
  const ro = !canEdit;
  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <Field label="Institution name" htmlFor="institutionName" error={err.institutionName}>
        <Input id="institutionName" name="institutionName" defaultValue={value.institutionName} className={compact} readOnly={ro} />
      </Field>
      <Field label="Short name" htmlFor="shortName" error={err.shortName}>
        <Input id="shortName" name="shortName" defaultValue={value.shortName} className={compact} readOnly={ro} />
      </Field>
      <StringList name="addressLines" label="Address lines" initial={value.addressLines} errors={err} disabled={ro} />
      <StringList name="phones" label="Phones" initial={value.phones} placeholder="+856 20 …" errors={err} disabled={ro} type="tel" />
      <StringList name="emails" label="Emails" initial={value.emails} placeholder="admissions@…" errors={err} disabled={ro} type="email" />
      <StringList name="officeHours" label="Office hours" initial={value.officeHours} placeholder="Monday – Friday, 8:30 – 17:00" errors={err} disabled={ro} />
      <Field label="WhatsApp" htmlFor="whatsapp" hint="International format, digits only preferred." error={err.whatsapp}>
        <Input id="whatsapp" name="whatsapp" defaultValue={value.whatsapp} className={compact} readOnly={ro} />
      </Field>
      <Field label="Map embed URL" htmlFor="mapEmbedUrl" hint="https:// only." error={err.mapEmbedUrl}>
        <Input id="mapEmbedUrl" name="mapEmbedUrl" defaultValue={value.mapEmbedUrl} className={`${compact} font-mono`} readOnly={ro} aria-invalid={Boolean(err.mapEmbedUrl)} />
      </Field>
      <Field label="Map latitude" htmlFor="mapLat" error={err.mapLat}>
        <Input id="mapLat" name="mapLat" inputMode="decimal" defaultValue={value.mapLat ?? ""} className={`${compact} font-mono`} readOnly={ro} aria-invalid={Boolean(err.mapLat)} />
      </Field>
      <Field label="Map longitude" htmlFor="mapLng" error={err.mapLng}>
        <Input id="mapLng" name="mapLng" inputMode="decimal" defaultValue={value.mapLng ?? ""} className={`${compact} font-mono`} readOnly={ro} aria-invalid={Boolean(err.mapLng)} />
      </Field>
      <fieldset className="grid gap-3 md:col-span-2 md:grid-cols-2">
        <legend className="mb-2 text-sm font-medium text-fg">Social links</legend>
        {(["facebook", "linkedin", "youtube", "instagram", "tiktok"] as const).map((k) => (
          <Field key={k} label={k[0].toUpperCase() + k.slice(1)} htmlFor={`social.${k}`} error={err[`social.${k}`]}>
            <Input id={`social.${k}`} name={`social.${k}`} defaultValue={value.social[k] ?? ""} className={`${compact} font-mono`} readOnly={ro} placeholder="https://" aria-invalid={Boolean(err[`social.${k}`])} />
          </Field>
        ))}
      </fieldset>
      <Field label="Admissions contact" htmlFor="admissionsContact" hint="Name, role or email shown on admissions pages." error={err.admissionsContact}>
        <Input id="admissionsContact" name="admissionsContact" defaultValue={value.admissionsContact} className={compact} readOnly={ro} />
      </Field>
      <Field label="Press contact" htmlFor="pressContact" error={err.pressContact}>
        <Input id="pressContact" name="pressContact" defaultValue={value.pressContact} className={compact} readOnly={ro} />
      </Field>
      <SaveBar canEdit={canEdit} state={state} />
    </form>
  );
}

export function MessagingSettingsForm({ value, canEdit }: { value: MessagingSettings; canEdit: boolean }) {
  const [state, action] = useActionState(saveMessagingSettings, initialActionState);
  const err = state.errors ?? {};
  const ro = !canEdit;
  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <Field label="Hero line 1" htmlFor="heroLine1" error={err.heroLine1}>
        <Input id="heroLine1" name="heroLine1" defaultValue={value.heroLine1} className={compact} readOnly={ro} maxLength={80} />
      </Field>
      <Field label="Hero line 2" htmlFor="heroLine2" error={err.heroLine2}>
        <Input id="heroLine2" name="heroLine2" defaultValue={value.heroLine2} className={compact} readOnly={ro} maxLength={80} />
      </Field>
      <Field label="Hero supporting text" htmlFor="heroSupport" error={err.heroSupport} className="md:col-span-2">
        <Textarea id="heroSupport" name="heroSupport" defaultValue={value.heroSupport} className="min-h-20 text-sm" readOnly={ro} maxLength={400} />
      </Field>
      <Field label="Tagline" htmlFor="tagline" error={err.tagline} className="md:col-span-2">
        <Input id="tagline" name="tagline" defaultValue={value.tagline} className={compact} readOnly={ro} maxLength={120} />
      </Field>
      <Field label="Final CTA title" htmlFor="finalCtaTitle" error={err.finalCtaTitle} className="md:col-span-2">
        <Input id="finalCtaTitle" name="finalCtaTitle" defaultValue={value.finalCtaTitle} className={compact} readOnly={ro} maxLength={120} />
      </Field>
      <Field label="Final CTA body" htmlFor="finalCtaBody" error={err.finalCtaBody} className="md:col-span-2">
        <Textarea id="finalCtaBody" name="finalCtaBody" defaultValue={value.finalCtaBody} className="min-h-24 text-sm" readOnly={ro} maxLength={600} />
      </Field>
      <Field label="Guidance disclaimer" htmlFor="guidanceDisclaimer" required hint="Shown under every guidance tool. Keep the meaning: guidance, not a formal admissions decision." error={err.guidanceDisclaimer} className="md:col-span-2">
        <Textarea id="guidanceDisclaimer" name="guidanceDisclaimer" defaultValue={value.guidanceDisclaimer} className="min-h-16 text-sm" readOnly={ro} required maxLength={300} aria-invalid={Boolean(err.guidanceDisclaimer)} />
      </Field>
      <Field label="Announcement bar" htmlFor="announcement" hint="Leave empty to hide." error={err.announcement} className="md:col-span-2">
        <Input id="announcement" name="announcement" defaultValue={value.announcement} className={compact} readOnly={ro} maxLength={200} />
      </Field>
      <SaveBar canEdit={canEdit} state={state} />
    </form>
  );
}

export function InstitutionSettingsForm({ value, canEdit }: { value: InstitutionSettings; canEdit: boolean }) {
  const [state, action] = useActionState(saveInstitutionSettings, initialActionState);
  const err = state.errors ?? {};
  const ro = !canEdit;
  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <Field label="Established (year)" htmlFor="established" error={err.established}>
        <Input id="established" name="established" inputMode="numeric" defaultValue={value.established ?? ""} className={`${compact} font-mono`} readOnly={ro} aria-invalid={Boolean(err.established)} />
      </Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm text-fg">
        <Checkbox name="ncukStudyCentre" defaultChecked={value.ncukStudyCentre} disabled={ro} />
        NCUK study centre
        {ro && value.ncukStudyCentre ? <input type="hidden" name="ncukStudyCentre" value="on" /> : null}
      </label>
      <Field label="Authorisation statement" htmlFor="authorisation" hint="Only verified wording — cite the source below." error={err.authorisation} className="md:col-span-2">
        <Textarea id="authorisation" name="authorisation" defaultValue={value.authorisation} className="min-h-20 text-sm" readOnly={ro} />
      </Field>
      <Field label="Authorisation source" htmlFor="authorisationSource" hint="Reference tag or URL, e.g. [NCUK-SHV]." error={err.authorisationSource}>
        <Input id="authorisationSource" name="authorisationSource" defaultValue={value.authorisationSource} className={`${compact} font-mono`} readOnly={ro} />
      </Field>
      <Field label="NCUK since" htmlFor="ncukSince" error={err.ncukSince}>
        <Input id="ncukSince" name="ncukSince" defaultValue={value.ncukSince} className={compact} readOnly={ro} />
      </Field>
      <Field label="Sister institution" htmlFor="sisterInstitution" error={err.sisterInstitution} className="md:col-span-2">
        <Input id="sisterInstitution" name="sisterInstitution" defaultValue={value.sisterInstitution} className={compact} readOnly={ro} />
      </Field>
      <Field label="Vision" htmlFor="vision" error={err.vision}>
        <Textarea id="vision" name="vision" defaultValue={value.vision} className="min-h-24 text-sm" readOnly={ro} />
      </Field>
      <Field label="Mission" htmlFor="mission" error={err.mission}>
        <Textarea id="mission" name="mission" defaultValue={value.mission} className="min-h-24 text-sm" readOnly={ro} />
      </Field>
      <Field label="Governance note" htmlFor="governanceNote" error={err.governanceNote} className="md:col-span-2">
        <Textarea id="governanceNote" name="governanceNote" defaultValue={value.governanceNote} className="min-h-20 text-sm" readOnly={ro} />
      </Field>
      <Field label="Official visa information link" htmlFor="visaOfficialLink" hint="Link to the official government source; never summarise visa rules ourselves." error={err.visaOfficialLink} className="md:col-span-2">
        <Input id="visaOfficialLink" name="visaOfficialLink" defaultValue={value.visaOfficialLink} className={`${compact} font-mono`} readOnly={ro} placeholder="https://" aria-invalid={Boolean(err.visaOfficialLink)} />
      </Field>
      <Field label="Accommodation note" htmlFor="accommodationNote" error={err.accommodationNote}>
        <Textarea id="accommodationNote" name="accommodationNote" defaultValue={value.accommodationNote} className="min-h-20 text-sm" readOnly={ro} />
      </Field>
      <Field label="Costs note" htmlFor="costsNote" hint="No fee figures unless verified and approved." error={err.costsNote}>
        <Textarea id="costsNote" name="costsNote" defaultValue={value.costsNote} className="min-h-20 text-sm" readOnly={ro} />
      </Field>
      <SaveBar canEdit={canEdit} state={state} />
    </form>
  );
}
