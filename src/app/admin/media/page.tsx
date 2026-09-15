import type { Metadata } from "next";
import Link from "next/link";
import { MEDIA_KINDS } from "@/lib/enums";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/admin/session";
import { Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/admin/page-header";
import { MediaUpload } from "@/components/admin/media-upload";
import { MediaGrid } from "@/components/admin/media-grid";
import { Pagination } from "@/components/admin/list-toolbar";
import { buttonClass } from "@/components/admin/button-class";

export const metadata: Metadata = { title: "Media library" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 48;
type SP = { q?: string; kind?: string; page?: string; deleted?: string };

export default async function MediaLibraryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const kind = sp.kind && MEDIA_KINDS.includes(sp.kind as (typeof MEDIA_KINDS)[number]) ? sp.kind : "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const where = {
    ...(kind ? { kind } : {}),
    ...(q ? { OR: [{ filename: { contains: q } }, { alt: { contains: q } }, { tagsJson: { contains: q } }, { caption: { contains: q } }] } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: { id: true, url: true, alt: true, kind: true, filename: true, usageStatus: true, consentStatus: true, sizeBytes: true } }),
  ]);

  return (
    <>
      <PageHeader title="Media library" description="Photography, logos, video and PDFs. Alt text, usage status and consent are recorded per file." crumbs={[{ label: "Dashboard", href: "/admin" }]} />
      {sp.deleted ? (
        <p role="status" className="mb-4 rounded-[var(--radius-sm)] border border-success/40 bg-bg-raised px-3 py-2 text-sm text-success">
          File deleted.
        </p>
      ) : null}
      {can(user.role, "media.upload") ? (
        <div className="mb-5">
          <MediaUpload />
        </div>
      ) : null}
      <form method="get" action="/admin/media" className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="q" className="sr-only">
            Search media
          </label>
          <Input id="q" name="q" type="search" defaultValue={q} placeholder="Search filename, alt text, caption or tags" className="h-10 text-sm" maxLength={100} />
        </div>
        <div>
          <label htmlFor="kind" className="sr-only">
            Kind
          </label>
          <Select id="kind" name="kind" defaultValue={kind} className="h-10 w-40 text-sm">
            <option value="">All kinds</option>
            {MEDIA_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </Select>
        </div>
        <button type="submit" className={buttonClass("secondary")}>
          Apply
        </button>
        {q || kind ? (
          <Link href="/admin/media" className={buttonClass("ghost")}>
            Clear
          </Link>
        ) : null}
      </form>
      <MediaGrid items={items} />
      <Pagination base="/admin/media" page={page} pages={Math.max(1, Math.ceil(total / PAGE_SIZE))} total={total} params={{ q, kind }} />
    </>
  );
}
