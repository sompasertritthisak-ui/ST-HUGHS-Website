"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { BLOCK_TYPES, BLOCK_TYPE_LABELS } from "@/lib/enums";
import { addBlock } from "@/lib/admin/block-actions";
import { idle } from "@/lib/admin/types";
import { Select } from "@/components/ui/field";
import { SubmitButton } from "./primitives";
import { useActionToast } from "./toast";

export function BlockAddForm({ pageId }: { pageId: string }) {
  const [state, action] = useActionState(addBlock.bind(null, pageId), idle);
  useActionToast(state);
  return (
    <form action={action} className="flex items-center gap-2">
      <label htmlFor="block-type" className="sr-only">
        Block type
      </label>
      <Select id="block-type" name="type" defaultValue="RICH_TEXT" className="h-9 w-48 text-sm">
        {BLOCK_TYPES.map((t) => (
          <option key={t} value={t}>
            {BLOCK_TYPE_LABELS[t]}
          </option>
        ))}
      </Select>
      <SubmitButton variant="primary" size="sm">
        <Plus className="size-3.5" strokeWidth={1.75} aria-hidden /> Add block
      </SubmitButton>
    </form>
  );
}
