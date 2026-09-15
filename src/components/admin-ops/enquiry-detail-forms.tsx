"use client";

import { useActionState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, ROLE_LABELS, type Role } from "@/lib/enums";
import { addEnquiryNote, assignEnquiry, confirmConsultation, setFollowUp, updateEnquiryStatus } from "@/lib/admin-ops/enquiries-actions";
import { initialActionState } from "@/lib/admin-ops/types";
import { FormStatus, SubmitButton } from "./form-status";

const compact = "h-10 text-sm";

export function StatusForm({ enquiryId, status, disabled }: { enquiryId: string; status: string; disabled?: boolean }) {
  const [state, action] = useActionState(updateEnquiryStatus, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={enquiryId} />
      <Field label="Status" htmlFor="status" error={state.errors?.status}>
        <Select id="status" name="status" defaultValue={status} className={compact} disabled={disabled} aria-invalid={Boolean(state.errors?.status)}>
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ENQUIRY_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </Field>
      {disabled ? <p className="text-xs text-fg-muted">You can view but not change the status.</p> : <SubmitButton variant="secondary">Update status</SubmitButton>}
      <FormStatus state={state} />
    </form>
  );
}

export function AssignForm({ enquiryId, assignedToId, users, disabled }: { enquiryId: string; assignedToId: string | null; users: { id: string; name: string; role: string }[]; disabled?: boolean }) {
  const [state, action] = useActionState(assignEnquiry, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={enquiryId} />
      <Field label="Assigned counsellor" htmlFor="assignedToId" error={state.errors?.assignedToId}>
        <Select id="assignedToId" name="assignedToId" defaultValue={assignedToId ?? ""} className={compact} disabled={disabled} aria-invalid={Boolean(state.errors?.assignedToId)}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {ROLE_LABELS[u.role as Role] ?? u.role}
            </option>
          ))}
        </Select>
      </Field>
      {disabled ? <p className="text-xs text-fg-muted">You do not have the assign permission.</p> : <SubmitButton variant="secondary">Assign</SubmitButton>}
      <FormStatus state={state} />
    </form>
  );
}

export function FollowUpForm({ enquiryId, followUpAt, disabled }: { enquiryId: string; followUpAt: Date | null; disabled?: boolean }) {
  const [state, action] = useActionState(setFollowUp, initialActionState);
  const value = followUpAt ? followUpAt.toISOString().slice(0, 10) : "";
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={enquiryId} />
      <Field label="Follow-up date" htmlFor="followUpAt" hint="Leave blank to clear." error={state.errors?.followUpAt}>
        <Input id="followUpAt" name="followUpAt" type="date" defaultValue={value} className={compact} disabled={disabled} aria-invalid={Boolean(state.errors?.followUpAt)} />
      </Field>
      {disabled ? null : <SubmitButton variant="secondary">Save date</SubmitButton>}
      <FormStatus state={state} />
    </form>
  );
}

export function NoteForm({ enquiryId, disabled }: { enquiryId: string; disabled?: boolean }) {
  const [state, action] = useActionState(addEnquiryNote, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-3" key={state.ok ? state.at : "note"}>
      <input type="hidden" name="id" value={enquiryId} />
      <Field label="Add a note" htmlFor="body" hint="Internal only. Notes are never shown publicly or included in exports by default." error={state.errors?.body}>
        <Textarea id="body" name="body" className="min-h-24 text-sm" maxLength={4000} disabled={disabled} aria-invalid={Boolean(state.errors?.body)} />
      </Field>
      {disabled ? <p className="text-xs text-fg-muted">You can read notes but not add them.</p> : <SubmitButton>Add note</SubmitButton>}
      <FormStatus state={state} />
    </form>
  );
}

export function ConfirmConsultationForm({ enquiryId, confirmedAt, disabled }: { enquiryId: string; confirmedAt: Date | null; disabled?: boolean }) {
  const [state, action] = useActionState(confirmConsultation, initialActionState);
  if (confirmedAt) return null;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={enquiryId} />
      {disabled ? null : <SubmitButton variant="primary">Mark consultation confirmed</SubmitButton>}
      <FormStatus state={state} />
    </form>
  );
}
