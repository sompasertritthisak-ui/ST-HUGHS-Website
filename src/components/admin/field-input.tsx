"use client";

import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import type { FieldDef } from "@/lib/admin/types";
import type { MediaPreview, RelationOption } from "@/lib/admin/queries";
import { MediaPicker } from "./media-picker";

const control = "h-10 text-[0.9375rem]";
const area = "min-h-28 text-[0.9375rem]";

export interface FieldInputProps {
  field: FieldDef;
  value: string | boolean | undefined;
  error?: string;
  options?: RelationOption[];
  mediaPreview?: MediaPreview | null;
  disabled?: boolean;
  idPrefix?: string;
}

/** Renders one registry field as a labelled control. Values are the strings produced by `toFormValues`. */
export function FieldInput({ field, value, error, options = [], mediaPreview, disabled, idPrefix = "" }: FieldInputProps) {
  const id = `${idPrefix}${field.name}`;
  const str = typeof value === "string" ? value : "";
  const describedBy = error ? `${id}-error` : field.hint ? `${id}-hint` : undefined;
  const common = { id, name: field.name, disabled, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };

  if (field.type === "boolean") {
    return (
      <div className="flex items-start gap-2.5 pt-6">
        <Checkbox {...common} defaultChecked={value === true} className="mt-0.5" />
        <div>
          <label htmlFor={id} className="text-sm font-medium text-fg">
            {field.label}
          </label>
          {field.hint ? <p id={`${id}-hint`} className="text-sm text-fg-subtle">{field.hint}</p> : null}
        </div>
      </div>
    );
  }

  let input: React.ReactNode;
  switch (field.type) {
    case "textarea":
      input = <Textarea {...common} defaultValue={str} className={area} maxLength={field.maxLength} />;
      break;
    case "markdown":
      input = <Textarea {...common} defaultValue={str} className={`${area} min-h-48 font-mono text-sm leading-relaxed`} />;
      break;
    case "json":
      input = <Textarea {...common} defaultValue={str} className={`${area} font-mono text-sm`} spellCheck={false} />;
      break;
    case "string-array":
      input = <Textarea {...common} defaultValue={str} className={`${area} min-h-24`} />;
      break;
    case "number":
      input = <Input {...common} type="number" defaultValue={str} step={field.integer ? 1 : "any"} min={field.min} max={field.max} className={control} />;
      break;
    case "date":
      input = <Input {...common} type="datetime-local" defaultValue={str} className={control} />;
      break;
    case "select":
      input = (
        <Select {...common} defaultValue={str} className={control}>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {field.optionLabels?.[o] ?? o}
            </option>
          ))}
        </Select>
      );
      break;
    case "relation":
      input = (
        <Select {...common} defaultValue={str} className={control}>
          <option value="">— None —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      );
      break;
    case "media":
      input = <MediaPicker name={field.name} value={str} preview={mediaPreview} kinds={field.mediaKinds} disabled={disabled} inputId={id} />;
      break;
    case "url":
      input = <Input {...common} type="text" inputMode="url" defaultValue={str} placeholder="https://" className={`${control} font-mono text-sm`} maxLength={field.maxLength ?? 500} />;
      break;
    case "slug":
      input = <Input {...common} type="text" defaultValue={str} className={`${control} font-mono text-sm`} maxLength={field.maxLength ?? 120} />;
      break;
    default:
      input = <Input {...common} type="text" defaultValue={str} className={control} maxLength={field.maxLength ?? 500} />;
  }

  const hint = field.type === "markdown" ? [field.hint, "Markdown supported."].filter(Boolean).join(" ") : field.hint;
  return (
    <Field label={field.label} htmlFor={id} required={field.required} error={error} hint={hint} className={field.fullWidth ? "md:col-span-2" : undefined}>
      {input}
    </Field>
  );
}
