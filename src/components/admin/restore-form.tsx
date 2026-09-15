"use client";

import { useActionState } from "react";
import { restoreRevision } from "@/lib/admin/actions";
import { idle } from "@/lib/admin/types";
import { ActionMessage, ConfirmSubmit } from "./primitives";
import { useActionToast } from "./toast";

export function RestoreForm({ entityKey, id, revisionId, version }: { entityKey: string; id: string; revisionId: string; version: number }) {
  const [state, action] = useActionState(restoreRevision.bind(null, entityKey, id, revisionId), idle);
  useActionToast(state);
  return (
    <form action={action} className="flex flex-col gap-2">
      <ConfirmSubmit label={`Restore version ${version}`} confirmLabel="Restore" size="sm" description="The current record is snapshotted first, then this version's fields are written back. Status is not changed." />
      <ActionMessage state={state} />
    </form>
  );
}
