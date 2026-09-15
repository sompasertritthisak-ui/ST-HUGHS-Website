import Link from "next/link";
import { EnquiryStatusBadge } from "@/components/ui/verification-badge";
import { AUDIENCE_LABELS, type Audience } from "@/lib/enums";
import type { EnquiryFilters, EnquiryListRow } from "@/lib/admin-ops/enquiries";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { EmptyRow, SortableTh, Table, Td, Th, Tr } from "./table";
import { Pagination } from "./pagination";
import { isOverdue } from "./enquiry-board";
import { ENQUIRY_TYPE_LABELS } from "./enquiry-filters";

export function EnquiryTable({ rows, total, filters, params }: { rows: EnquiryListRow[]; total: number; filters: EnquiryFilters; params: Record<string, string | undefined> }) {
  const sortProps = { current: filters.sort, dir: filters.dir, params: { ...params, view: "list" } };
  return (
    <>
      <Table caption="Enquiries">
        <thead>
          <tr>
            <SortableTh label="Name" field="name" {...sortProps} />
            <Th>Type</Th>
            <Th>Audience</Th>
            <Th>Programme</Th>
            <Th>Destination</Th>
            <SortableTh label="Status" field="status" {...sortProps} />
            <Th>Assigned</Th>
            <SortableTh label="Follow-up" field="followUpAt" {...sortProps} />
            <Th>Campaign</Th>
            <SortableTh label="Created" field="createdAt" {...sortProps} />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={10}>No enquiries match these filters.</EmptyRow>
          ) : (
            rows.map((e) => {
              const overdue = isOverdue(e.followUpAt, e.status);
              return (
                <Tr key={e.id}>
                  <Td>
                    <Link href={`/admin/enquiries/${e.id}`} className="font-medium text-fg underline-offset-2 hover:underline">
                      {e.name}
                    </Link>
                    <div className="text-xs text-fg-muted">{e.email}</div>
                  </Td>
                  <Td className="whitespace-nowrap text-fg-muted">{ENQUIRY_TYPE_LABELS[e.type as keyof typeof ENQUIRY_TYPE_LABELS] ?? e.type}</Td>
                  <Td className="whitespace-nowrap text-fg-muted">{AUDIENCE_LABELS[e.audience as Audience] ?? e.audience}</Td>
                  <Td className="max-w-56 truncate">{e.programme?.title ?? <span className="text-fg-subtle">—</span>}</Td>
                  <Td className="whitespace-nowrap">{e.destination?.country ?? <span className="text-fg-subtle">—</span>}</Td>
                  <Td>
                    <EnquiryStatusBadge status={e.status} />
                  </Td>
                  <Td className="whitespace-nowrap">{e.assignedTo?.name ?? <span className="text-fg-subtle">Unassigned</span>}</Td>
                  <Td className={cn("whitespace-nowrap", overdue && "font-medium text-danger")}>
                    {e.followUpAt ? (
                      <>
                        {formatDate(e.followUpAt, { month: "short" })}
                        {overdue ? <span className="sr-only"> (overdue)</span> : null}
                      </>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </Td>
                  <Td className="font-mono text-xs text-fg-muted">{e.utmCampaign ?? e.campaign?.name ?? <span className="text-fg-subtle">—</span>}</Td>
                  <Td className="whitespace-nowrap text-fg-muted">
                    <time dateTime={e.createdAt.toISOString()}>{formatDateTime(e.createdAt)}</time>
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Table>
      <Pagination page={filters.page} pageSize={25} total={total} params={{ ...params, view: "list" }} />
    </>
  );
}
