"use client";

import { useActionState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { deleteChild, moveChild, saveChild } from "@/lib/admin/child-actions";
import type { FormValues } from "@/lib/admin/schema";
import { idle, type ActionState, type FieldDef } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { FieldInput } from "./field-input";
import { ActionMessage, ConfirmSubmit, SubmitButton } from "./primitives";
import { useActionToast } from "./toast";

interface Props {
  entityKey: string;
  childKey: string;
  parentId: string;
  childId: string | null;
  title: string;
  fields: FieldDef[];
  values: FormValues;
  index: number;
  count: number;
  canWrite: boolean;
}

function SmallAction({ action, label, children, disabled }: { action: (prev: ActionState) => Promise<ActionState>; label: string; children: React.ReactNode; disabled?: boolean }) {
  const [state, formAction] = useActionState(action, idle);
  useActionToast(state);
  return (
    <form action={formAction}>
      <button type="submit" disabled={disabled} aria-label={label} title={label} className="inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)] border border-line text-fg-muted hover:bg-bg-hover hover:text-fg disabled:opacity-40">
        {children}
      </button>
    </form>
  );
}

function DeleteChildForm(p: { entityKey: string; childKey: string; parentId: string; childId: string }) {
  const [state, action] = useActionState(deleteChild.bind(null, p.entityKey, p.childKey, p.parentId, p.childId), idle);
  useActionToast(state);
  return (
    <form action={action}>
      <ConfirmSubmit label="Delete" confirmLabel="Delete" size="sm" />
      <ActionMessage state={state} />
    </form>
  );
}

export function ChildRow({ entityKey, childKey, parentId, childId, title, fields, values, index, count, canWrite }: Props) {
  const [state, action] = useActionState(saveChild.bind(null, entityKey, childKey, parentId, childId), idle);
  useActionToast(state);
  const errors = state.errors ?? {};
  const isNew = childId === null;
  const prefix = `${childKey}-${childId ?? "new"}-`;

  return (
    <details open={isNew} className={cn("group rounded-[var(--radius)] border", isNew ? "border-dashed border-line-strong" : "border-line bg-bg-raised")}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
        {!isNew ? <span className="font-mono text-[0.625rem] tabular text-fg-subtle">{String(index + 1).padStart(2, "0")}</span> : null}
        <span className={cn("text-fg", isNew ? "text-sm text-fg-muted" : "font-medium")}>{title || "(untitled)"}</span>
        {!isNew && canWrite ? (
          <span className="ml-auto flex items-center gap-1" onClick={(e) => e.preventDefault()}>
            <SmallAction action={moveChild.bind(null, entityKey, childKey, parentId, childId, "up")} label="Move up" disabled={index === 0}>
              <ArrowUp className="size-3.5" strokeWidth={1.5} aria-hidden />
            </SmallAction>
            <SmallAction action={moveChild.bind(null, entityKey, childKey, parentId, childId, "down")} label="Move down" disabled={index === count - 1}>
              <ArrowDown className="size-3.5" strokeWidth={1.5} aria-hidden />
            </SmallAction>
          </span>
        ) : null}
        <span aria-hidden className={cn("text-fg-subtle transition-transform group-open:rotate-180", isNew && "ml-auto")}>
          ⌄
        </span>
      </summary>
      <form action={action} noValidate className="flex flex-col gap-4 border-t border-line p-4">
        <fieldset disabled={!canWrite} className="grid gap-4 md:grid-cols-2">
          {fields.map((f) => (
            <FieldInput key={f.name} field={f} value={values[f.name]} error={errors[f.name]} disabled={!canWrite} idPrefix={prefix} />
          ))}
        </fieldset>
        {canWrite ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ActionMessage state={state} />
            <div className="ml-auto flex items-center gap-2">
              <SubmitButton variant="primary" size="sm">
                {isNew ? "Add" : "Save"}
              </SubmitButton>
            </div>
          </div>
        ) : null}
      </form>
      {childId && canWrite ? (
        <div className="border-t border-line px-4 py-3">
          <DeleteChildForm entityKey={entityKey} childKey={childKey} parentId={parentId} childId={childId} />
        </div>
      ) : null}
    </details>
  );
}
