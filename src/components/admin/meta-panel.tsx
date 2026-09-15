import Link from "next/link";
import { ExternalLink, History } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { AdminRecord, EntityDef } from "@/lib/admin/types";
import { DeleteForm } from "./delete-form";
import { Panel } from "./primitives";
import { buttonClass } from "@/components/admin/button-class";

export function MetaPanel({ def, record, canDelete }: { def: EntityDef; record: AdminRecord; canDelete: boolean }) {
  const paths = def.publicPaths(record);
  const slug = typeof record.slug === "string" && record.slug ? record.slug : null;
  const preview = (slug ? paths.find((p) => p.endsWith(`/${slug}`)) : undefined) ?? paths[0];
  const createdAt = record.createdAt instanceof Date ? record.createdAt : null;
  return (
    <Panel title="Record">
      <dl className="text-sm">
        <div className="flex justify-between gap-3 py-1">
          <dt className="text-fg-subtle">ID</dt>
          <dd className="font-mono text-xs text-fg-muted">{record.id}</dd>
        </div>
        {createdAt ? (
          <div className="flex justify-between gap-3 py-1">
            <dt className="text-fg-subtle">Created</dt>
            <dd>{formatDateTime(createdAt)}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-3 flex flex-col gap-2">
        {preview ? (
          <a href={`${preview}?preview=1`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
            Preview public page <ExternalLink className="size-3.5" strokeWidth={1.5} aria-hidden />
          </a>
        ) : null}
        <Link href={`/admin/${def.key}/${record.id}/revisions`} className={buttonClass("secondary", "sm")}>
          <History className="size-3.5" strokeWidth={1.5} aria-hidden /> Revision history
        </Link>
      </div>
      <p className="mt-2 text-xs text-fg-subtle">Preview shows the published version; draft preview is a follow-up.</p>
      {canDelete ? (
        <div className="mt-4 border-t border-line pt-4">
          <DeleteForm entityKey={def.key} id={record.id} label={`Delete ${def.labelSingular.toLowerCase()}`} />
        </div>
      ) : null}
    </Panel>
  );
}
