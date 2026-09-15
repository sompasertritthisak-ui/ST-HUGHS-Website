"use client";

import { useActionState } from "react";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { createCampaign, deleteCampaign, updateCampaign } from "@/lib/admin-ops/campaigns-actions";
import { initialActionState } from "@/lib/admin-ops/types";
import { FormStatus, SubmitButton } from "./form-status";

type CampaignValues = {
  id?: string;
  name: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

const compact = "h-10 text-sm";
const d = (v: Date | null) => (v ? v.toISOString().slice(0, 10) : "");

export function CampaignForm({ campaign }: { campaign?: CampaignValues }) {
  const [state, action] = useActionState(campaign ? updateCampaign : createCampaign, initialActionState);
  const err = state.errors ?? {};
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {campaign?.id ? <input type="hidden" name="id" value={campaign.id} /> : null}
      <Field label="Campaign name" htmlFor="name" required error={err.name} className="md:col-span-2">
        <Input id="name" name="name" defaultValue={campaign?.name ?? ""} className={compact} required maxLength={120} aria-invalid={Boolean(err.name)} />
      </Field>
      <Field label="utm_campaign" htmlFor="utmCampaign" required hint="Unique key. Enquiries and analytics events with this utm_campaign are attributed here." error={err.utmCampaign}>
        <Input id="utmCampaign" name="utmCampaign" defaultValue={campaign?.utmCampaign ?? ""} className={`${compact} font-mono`} required maxLength={120} aria-invalid={Boolean(err.utmCampaign)} />
      </Field>
      <Field label="Landing page" htmlFor="landingPage" hint="Relative path (/programmes) or https URL." error={err.landingPage}>
        <Input id="landingPage" name="landingPage" defaultValue={campaign?.landingPage ?? ""} className={`${compact} font-mono`} maxLength={500} aria-invalid={Boolean(err.landingPage)} />
      </Field>
      <Field label="utm_source" htmlFor="utmSource" error={err.utmSource}>
        <Input id="utmSource" name="utmSource" defaultValue={campaign?.utmSource ?? ""} className={`${compact} font-mono`} maxLength={120} placeholder="facebook" />
      </Field>
      <Field label="utm_medium" htmlFor="utmMedium" error={err.utmMedium}>
        <Input id="utmMedium" name="utmMedium" defaultValue={campaign?.utmMedium ?? ""} className={`${compact} font-mono`} maxLength={120} placeholder="social" />
      </Field>
      <Field label="Starts" htmlFor="startsAt" error={err.startsAt}>
        <Input id="startsAt" name="startsAt" type="date" defaultValue={d(campaign?.startsAt ?? null)} className={compact} aria-invalid={Boolean(err.startsAt)} />
      </Field>
      <Field label="Ends" htmlFor="endsAt" error={err.endsAt}>
        <Input id="endsAt" name="endsAt" type="date" defaultValue={d(campaign?.endsAt ?? null)} className={compact} aria-invalid={Boolean(err.endsAt)} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-fg md:col-span-2">
        <Checkbox name="isActive" defaultChecked={campaign?.isActive ?? true} /> Active
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <SubmitButton>{campaign ? "Save campaign" : "Create campaign"}</SubmitButton>
      </div>
      <FormStatus state={state} className="md:col-span-2" />
    </form>
  );
}

export function DeleteCampaignForm({ id, enquiryCount }: { id: string; enquiryCount: number }) {
  const [state, action] = useActionState(deleteCampaign, initialActionState);
  return (
    <form
      action={action}
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        if (!window.confirm("Delete this campaign? This cannot be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <p className="text-xs text-fg-muted">{enquiryCount > 0 ? `Linked to ${enquiryCount} enquir${enquiryCount === 1 ? "y" : "ies"} — deactivate instead of deleting to keep attribution.` : "No enquiries are linked to this campaign."}</p>
      <div>
        <SubmitButton variant="danger" pendingLabel="Deleting…">
          Delete campaign
        </SubmitButton>
      </div>
      <FormStatus state={state} />
    </form>
  );
}
