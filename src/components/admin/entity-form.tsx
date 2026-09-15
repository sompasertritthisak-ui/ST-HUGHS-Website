"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveEntity } from "@/lib/admin/actions";
import type { FormValues } from "@/lib/admin/schema";
import { idle, type FieldDef, type FieldGroup } from "@/lib/admin/types";
import type { MediaPreviews, RelationOptions } from "@/lib/admin/queries";
import { FieldInput } from "./field-input";
import { ActionMessage, SubmitButton, buttonClass } from "./primitives";
import { useActionToast } from "./toast";

interface Props {
  entityKey: string;
  id: string | null;
  fields: FieldDef[];
  values: FormValues;
  relationOptions: RelationOptions;
  mediaPreviews: MediaPreviews;
  canWrite: boolean;
  listHref: string;
}

const GROUPS: { key: FieldGroup; title: string; open: boolean; note?: string }[] = [
  { key: "details", title: "Details", open: true },
  { key: "governance", title: "Governance", open: true, note: "Owner, verification and review dates. Time-sensitive facts must carry a source." },
  { key: "seo", title: "SEO & sharing", open: false },
];

export function EntityForm({ entityKey, id, fields, values, relationOptions, mediaPreviews, canWrite, listHref }: Props) {
  const [state, action] = useActionState(saveEntity.bind(null, entityKey, id), idle);
  useActionToast(state);
  const errors = state.errors ?? {};
  const main = fields.filter((f) => !f.group || f.group === "main");

  const render = (f: FieldDef) => <FieldInput key={f.name} field={f} value={values[f.name]} error={errors[f.name]} options={relationOptions[f.name]} mediaPreview={mediaPreviews[f.name]} disabled={!canWrite} />;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <fieldset disabled={!canWrite} className="contents">
        <section className="rounded-[var(--radius)] border border-line bg-bg-raised p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">{main.map(render)}</div>
        </section>
        {GROUPS.map((g) => {
          const list = fields.filter((f) => f.group === g.key);
          if (list.length === 0) return null;
          return (
            <details key={g.key} open={g.open} className="group rounded-[var(--radius)] border border-line bg-bg-raised shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle [&::-webkit-details-marker]:hidden">
                {g.title}
                <span aria-hidden className="text-fg-subtle transition-transform group-open:rotate-180">
                  ⌄
                </span>
              </summary>
              <div className="border-t border-line p-5">
                {g.note ? <p className="mb-4 text-sm text-fg-muted">{g.note}</p> : null}
                <div className="grid gap-4 md:grid-cols-2">{list.map(render)}</div>
              </div>
            </details>
          );
        })}
      </fieldset>
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-line bg-bg-raised/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <ActionMessage state={state} />
        <div className="ml-auto flex items-center gap-2">
          <Link href={listHref} className={buttonClass("ghost")}>
            Back to list
          </Link>
          {canWrite ? <SubmitButton variant="primary">{id ? "Save changes" : "Create"}</SubmitButton> : <span className="text-sm text-fg-subtle">Read-only</span>}
        </div>
      </div>
    </form>
  );
}
