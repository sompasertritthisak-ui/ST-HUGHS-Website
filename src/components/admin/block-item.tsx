"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { deleteBlock, moveBlock, toggleBlock, updateBlock } from "@/lib/admin/block-actions";
import type { FormValues } from "@/lib/admin/schema";
import { idle, type ActionState, type FieldDef } from "@/lib/admin/types";
import type { MediaPreview } from "@/lib/admin/queries";
import { Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { FieldInput } from "./field-input";
import { ActionMessage, ConfirmSubmit, SubmitButton } from "./primitives";
import { useActionToast } from "./toast";

export interface BlockView {
  id: string;
  type: string;
  label: string;
  isVisible: boolean;
  dataJson: string;
  fields: FieldDef[];
  values: FormValues;
  mediaPreviews: Record<string, MediaPreview | null>;
}

function IconAction({ action, label, children, disabled }: { action: (prev: ActionState) => Promise<ActionState>; label: string; children: React.ReactNode; disabled?: boolean }) {
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

function DeleteBlockForm({ id }: { id: string }) {
  const [state, action] = useActionState(deleteBlock.bind(null, id), idle);
  useActionToast(state);
  return (
    <form action={action} className="flex flex-col gap-1">
      <ConfirmSubmit label="Delete block" confirmLabel="Delete" size="sm" />
      <ActionMessage state={state} />
    </form>
  );
}

export function BlockItem({ block, index, count, canWrite }: { block: BlockView; index: number; count: number; canWrite: boolean }) {
  const [mode, setMode] = useState<"form" | "json">(block.fields.length ? "form" : "json");
  const [state, action] = useActionState(updateBlock.bind(null, block.id), idle);
  useActionToast(state);
  const errors = state.errors ?? {};
  const prefix = `b-${block.id}-`;

  return (
    <details className={cn("group rounded-[var(--radius)] border border-line", block.isVisible ? "bg-bg-raised" : "bg-bg-hover/60")}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-[0.625rem] tabular text-fg-subtle">{String(index + 1).padStart(2, "0")}</span>
        <span className="font-medium text-fg">{block.label}</span>
        {!block.isVisible ? <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-warning">Hidden</span> : null}
        <span className="ml-auto flex items-center gap-1" onClick={(e) => e.preventDefault()}>
          {canWrite ? (
            <>
              <IconAction action={moveBlock.bind(null, block.id, "up")} label="Move up" disabled={index === 0}>
                <ArrowUp className="size-3.5" strokeWidth={1.5} aria-hidden />
              </IconAction>
              <IconAction action={moveBlock.bind(null, block.id, "down")} label="Move down" disabled={index === count - 1}>
                <ArrowDown className="size-3.5" strokeWidth={1.5} aria-hidden />
              </IconAction>
              <IconAction action={toggleBlock.bind(null, block.id)} label={block.isVisible ? "Hide block" : "Show block"}>
                {block.isVisible ? <Eye className="size-3.5" strokeWidth={1.5} aria-hidden /> : <EyeOff className="size-3.5" strokeWidth={1.5} aria-hidden />}
              </IconAction>
            </>
          ) : null}
        </span>
        <span aria-hidden className="text-fg-subtle transition-transform group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <div className="border-t border-line p-4">
        <div className="mb-3 flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.14em]">
          <button type="button" onClick={() => setMode("form")} disabled={block.fields.length === 0} className={cn("rounded px-2 py-1", mode === "form" ? "bg-bg-hover text-fg" : "text-fg-subtle hover:text-fg")}>
            Fields
          </button>
          <button type="button" onClick={() => setMode("json")} className={cn("rounded px-2 py-1", mode === "json" ? "bg-bg-hover text-fg" : "text-fg-subtle hover:text-fg")}>
            JSON
          </button>
        </div>
        <form action={action} noValidate className="flex flex-col gap-4">
          <input type="hidden" name="mode" value={mode} />
          <fieldset disabled={!canWrite} className="contents">
            {mode === "form" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {block.fields.map((f) => (
                  <FieldInput key={f.name} field={f} value={block.values[f.name]} error={errors[f.name]} mediaPreview={block.mediaPreviews[f.name]} disabled={!canWrite} idPrefix={prefix} />
                ))}
              </div>
            ) : (
              <div>
                <label htmlFor={`${prefix}json`} className="text-sm font-medium text-fg">
                  Block data (JSON object)
                </label>
                <Textarea id={`${prefix}json`} name="dataJson" defaultValue={block.dataJson} spellCheck={false} className="mt-1.5 min-h-48 font-mono text-sm" aria-invalid={errors.dataJson ? true : undefined} />
                {errors.dataJson ? <p role="alert" className="mt-1 text-sm text-danger">{errors.dataJson}</p> : <p className="mt-1 text-sm text-fg-subtle">Validated as JSON on save. No code is ever executed from block data.</p>}
              </div>
            )}
          </fieldset>
          {canWrite ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ActionMessage state={state} />
              <div className="ml-auto flex items-center gap-2">
                <SubmitButton variant="primary" size="sm">
                  Save block
                </SubmitButton>
              </div>
            </div>
          ) : null}
        </form>
        {canWrite ? (
          <div className="mt-3 border-t border-line pt-3">
            <DeleteBlockForm id={block.id} />
          </div>
        ) : null}
      </div>
    </details>
  );
}

