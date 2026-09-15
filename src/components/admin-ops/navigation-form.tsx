"use client";

import { useActionState, useState } from "react";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { saveNavigationItem } from "@/lib/admin-ops/navigation-actions";
import { initialActionState } from "@/lib/admin-ops/types";
import { FormStatus, SubmitButton } from "./form-status";

const compact = "h-10 text-sm";

export type NavItemValues = {
  id?: string;
  menu: string;
  label: string;
  href: string;
  description: string | null;
  isVisible: boolean;
  parentId: string | null;
};

export function NavItemForm({ item, menu, parents, compactMode }: { item?: NavItemValues; menu: string; parents: { id: string; label: string }[]; compactMode?: boolean }) {
  const [state, action] = useActionState(saveNavigationItem, initialActionState);
  const [open, setOpen] = useState(!item);
  const err = state.errors ?? {};
  const uid = item?.id ?? "new";

  if (item && compactMode && !open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-fg underline underline-offset-2 hover:text-fg-muted">
        Edit
      </button>
    );
  }

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2" key={state.ok && !item ? state.at : uid}>
      {item?.id ? <input type="hidden" name="id" value={item.id} /> : null}
      <input type="hidden" name="menu" value={menu} />
      <Field label="Label" htmlFor={`label-${uid}`} required error={err.label}>
        <Input id={`label-${uid}`} name="label" defaultValue={item?.label ?? ""} className={compact} required maxLength={80} aria-invalid={Boolean(err.label)} />
      </Field>
      <Field label="Link" htmlFor={`href-${uid}`} required hint="Relative path (/programmes) or https URL." error={err.href}>
        <Input id={`href-${uid}`} name="href" defaultValue={item?.href ?? ""} className={`${compact} font-mono`} required maxLength={500} aria-invalid={Boolean(err.href)} />
      </Field>
      <Field label="Description" htmlFor={`description-${uid}`} hint="Shown in the header mega-menu." error={err.description} className={menu === "HEADER" ? "" : "md:col-span-2"}>
        <Input id={`description-${uid}`} name="description" defaultValue={item?.description ?? ""} className={compact} maxLength={200} />
      </Field>
      {menu === "HEADER" ? (
        <Field label="Parent (nest under)" htmlFor={`parentId-${uid}`} hint="One level only." error={err.parentId}>
          <Select id={`parentId-${uid}`} name="parentId" defaultValue={item?.parentId ?? ""} className={compact} aria-invalid={Boolean(err.parentId)}>
            <option value="">Top level</option>
            {parents
              .filter((p) => p.id !== item?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
          </Select>
        </Field>
      ) : null}
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <label className="flex items-center gap-2 text-sm text-fg">
          <Checkbox name="isVisible" defaultChecked={item?.isVisible ?? true} /> Visible
        </label>
        <SubmitButton variant={item ? "secondary" : "primary"}>{item ? "Save" : "Add item"}</SubmitButton>
        {item && compactMode ? (
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-fg-muted hover:text-fg">
            Cancel
          </button>
        ) : null}
      </div>
      <FormStatus state={state} className="md:col-span-2" />
    </form>
  );
}
