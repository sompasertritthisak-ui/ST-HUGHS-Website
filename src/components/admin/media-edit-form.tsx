"use client";

import { useActionState } from "react";
import { CONSENT_STATUSES, USAGE_STATUSES } from "@/lib/enums";
import { deleteMedia, updateMedia } from "@/lib/admin/media-actions";
import { idle } from "@/lib/admin/types";
import { CONSENT_LABELS } from "@/lib/admin/fields";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FocalPointPicker } from "./focal-point-picker";
import { ActionMessage, ConfirmSubmit, SubmitButton } from "./primitives";
import { useActionToast } from "./toast";

const USAGE_LABELS: Record<string, string> = { APPROVED: "Approved for public use", INTERNAL: "Internal only", RESTRICTED: "Restricted", EXPIRED: "Expired" };

export interface MediaEditValues {
  id: string;
  url: string;
  kind: string;
  alt: string;
  caption: string;
  credit: string;
  focalX: number;
  focalY: number;
  tags: string;
  usageStatus: string;
  consentStatus: string;
}

export function MediaEditForm({ media, canWrite, canDelete }: { media: MediaEditValues; canWrite: boolean; canDelete: boolean }) {
  const [state, action] = useActionState(updateMedia.bind(null, media.id), idle);
  useActionToast(state);
  const errors = state.errors ?? {};
  const isImage = media.kind === "IMAGE" || media.kind === "LOGO";
  const control = "h-10 text-[0.9375rem]";
  return (
    <div className="flex flex-col gap-6">
    <form action={action} noValidate className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div>
        {isImage ? (
          <FocalPointPicker url={media.url} alt={media.alt} initialX={media.focalX} initialY={media.focalY} disabled={!canWrite} />
        ) : (
          <div className="rounded-[var(--radius)] border border-line bg-bg-raised p-6 text-sm text-fg-muted">
            <input type="hidden" name="focalX" value="0.5" />
            <input type="hidden" name="focalY" value="0.5" />
            {media.kind} file.{" "}
            <a href={media.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
              Open file
            </a>
          </div>
        )}
      </div>
      <fieldset disabled={!canWrite} className="flex flex-col gap-4 rounded-[var(--radius)] border border-line bg-bg-raised p-5 shadow-sm">
        <Field label="Alt text" htmlFor="alt" error={errors.alt} hint="Describe the image for screen readers. Required before approval." required>
          <Input id="alt" name="alt" defaultValue={media.alt} maxLength={300} className={control} aria-invalid={errors.alt ? true : undefined} />
        </Field>
        <Field label="Caption" htmlFor="caption" error={errors.caption}>
          <Textarea id="caption" name="caption" defaultValue={media.caption} className="min-h-20 text-[0.9375rem]" maxLength={500} />
        </Field>
        <Field label="Credit / copyright" htmlFor="credit" error={errors.credit}>
          <Input id="credit" name="credit" defaultValue={media.credit} maxLength={200} className={control} />
        </Field>
        <Field label="Tags" htmlFor="tags" hint="One per line or comma separated.">
          <Textarea id="tags" name="tags" defaultValue={media.tags} className="min-h-20 text-[0.9375rem]" />
        </Field>
        <Field label="Usage status" htmlFor="usageStatus" error={errors.usageStatus}>
          <Select id="usageStatus" name="usageStatus" defaultValue={media.usageStatus} className={control}>
            {USAGE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {USAGE_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Consent status" htmlFor="consentStatus" error={errors.consentStatus} hint="Photos of students require granted consent before public use.">
          <Select id="consentStatus" name="consentStatus" defaultValue={media.consentStatus} className={control}>
            {CONSENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CONSENT_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <ActionMessage state={state} />
        {canWrite ? <SubmitButton variant="primary">Save media</SubmitButton> : <p className="text-sm text-fg-subtle">Read-only</p>}
      </fieldset>
    </form>
    {canDelete ? <DeleteMediaForm id={media.id} /> : null}
    </div>
  );
}

function DeleteMediaForm({ id }: { id: string }) {
  const [state, action] = useActionState(deleteMedia.bind(null, id), idle);
  useActionToast(state);
  return (
    <form action={action} className="flex flex-col gap-2 rounded-[var(--radius)] border border-danger/30 bg-bg-raised p-4">
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">Danger zone</p>
      <ConfirmSubmit label="Delete file" confirmLabel="Delete file and record" size="sm" description="Refused if any content still references this file." />
      <ActionMessage state={state} />
    </form>
  );
}
