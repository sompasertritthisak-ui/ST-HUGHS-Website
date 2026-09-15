import type { AdminRecord, ChildDef } from "@/lib/admin/types";
import { toFormValues } from "@/lib/admin/schema";
import { ChildRow } from "./child-row";
import { Panel } from "./primitives";

/** Inline ordered children (programme modules, pathway steps). */
export function ChildList({ entityKey, parentId, child, rows, canWrite }: { entityKey: string; parentId: string; child: ChildDef; rows: AdminRecord[]; canWrite: boolean }) {
  return (
    <Panel title={`${child.label} (${rows.length})`}>
      {rows.length === 0 ? <p className="mb-3 text-sm text-fg-muted">No {child.label.toLowerCase()} yet.</p> : null}
      <ol className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <li key={row.id}>
            <ChildRow entityKey={entityKey} childKey={child.key} parentId={parentId} childId={row.id} title={String(row[child.titleField] ?? "")} fields={child.fields} values={toFormValues(child.fields, row)} index={i} count={rows.length} canWrite={canWrite} />
          </li>
        ))}
      </ol>
      {canWrite ? (
        <div className="mt-4 border-t border-line pt-4">
          <ChildRow entityKey={entityKey} childKey={child.key} parentId={parentId} childId={null} title={`Add ${child.labelSingular.toLowerCase()}`} fields={child.fields} values={toFormValues(child.fields, null)} index={rows.length} count={rows.length} canWrite />
        </div>
      ) : null}
    </Panel>
  );
}
