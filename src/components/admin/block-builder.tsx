import { prisma } from "@/lib/prisma";
import { BLOCK_TYPE_LABELS, type BlockType } from "@/lib/enums";
import { blockFields } from "@/lib/admin/blocks";
import { toFormValues } from "@/lib/admin/schema";
import type { MediaPreview } from "@/lib/admin/queries";
import { EmptyState } from "@/components/ui/empty-state";
import { BlockAddForm } from "./block-add";
import { BlockItem, type BlockView } from "./block-item";
import { Panel } from "./primitives";

interface BlockRow {
  id: string;
  type: string;
  order: number;
  isVisible: boolean;
  dataJson: string;
}

/** Server component: prepares block data + media previews and renders the ordered builder. */
export async function BlockBuilder({ pageId, blocks, canWrite }: { pageId: string; blocks: BlockRow[]; canWrite: boolean }) {
  const parsed = blocks.map((b) => {
    let data: Record<string, unknown> = {};
    try {
      const raw: unknown = JSON.parse(b.dataJson);
      if (raw && typeof raw === "object" && !Array.isArray(raw)) data = raw as Record<string, unknown>;
    } catch {
      data = {};
    }
    return { block: b, data, fields: blockFields(b.type) };
  });

  const mediaIds = new Set<string>();
  for (const p of parsed) for (const f of p.fields) if (f.type === "media" && typeof p.data[f.name] === "string" && p.data[f.name]) mediaIds.add(p.data[f.name] as string);
  const media = mediaIds.size ? await prisma.media.findMany({ where: { id: { in: [...mediaIds] } }, select: { id: true, url: true, alt: true, kind: true, filename: true } }) : [];
  const previews = new Map<string, MediaPreview>(media.map((m) => [m.id, m]));

  const views: BlockView[] = parsed.map((p) => ({
    id: p.block.id,
    type: p.block.type,
    label: BLOCK_TYPE_LABELS[p.block.type as BlockType] ?? p.block.type,
    isVisible: p.block.isVisible,
    dataJson: JSON.stringify(p.data, null, 2),
    fields: p.fields,
    values: toFormValues(p.fields, p.data),
    mediaPreviews: Object.fromEntries(p.fields.filter((f) => f.type === "media").map((f) => [f.name, previews.get(String(p.data[f.name] ?? "")) ?? null])),
  }));

  return (
    <Panel title={`Blocks (${views.length})`} action={canWrite ? <BlockAddForm pageId={pageId} /> : null}>
      {views.length === 0 ? (
        <EmptyState title="No blocks yet" body="Add a hero, rich text or any other block type to start building this page." />
      ) : (
        <ol className="flex flex-col gap-3">
          {views.map((v, i) => (
            <li key={v.id}>
              <BlockItem block={v} index={i} count={views.length} canWrite={canWrite} />
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
