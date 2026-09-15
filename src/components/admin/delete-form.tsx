"use client";

import { useActionState } from "react";
import { deleteEntity } from "@/lib/admin/actions";
import { idle } from "@/lib/admin/types";
import { ActionMessage, ConfirmSubmit } from "./primitives";
import { useActionToast } from "./toast";

export function DeleteForm({ entityKey, id, label }: { entityKey: string; id: string; label: string }) {
  const [state, action] = useActionState(deleteEntity.bind(null, entityKey, id), idle);
  useActionToast(state);
  return (
    <form action={action} className="flex flex-col gap-2">
      <ConfirmSubmit label={label} confirmLabel="Delete permanently" size="sm" description="A snapshot is kept in the revision history, but the record and its public page will be removed." />
      <ActionMessage state={state} />
    </form>
  );
}
