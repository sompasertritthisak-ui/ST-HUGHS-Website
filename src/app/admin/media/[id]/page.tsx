import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatDateTime, parseStringArray } from "@/lib/utils";
import { requireUser } from "@/lib/admin/session";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { MediaEditForm } from "@/components/admin/media-edit-form";

export const dynamic = "force-dynamic";
const ID_RE = /^[a-z0-9_-]{5,64}$/i;
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = ID_RE.test(id) ? await prisma.media.findUnique({ where: { id }, select: { filename: true } }) : null;
  return { title: m ? `${m.filename} — Media` : "Not found" };
}

const REFS = { programmesHero: true, destinationsHero: true, universityLogos: true, partnerLogos: true, storyPhotos: true, facultyPhotos: true, facilityPhotos: true, newsHero: true, eventHero: true, documents: true, pageOgImages: true } as const;

export default async function MediaEditPage({ params }: Props) {
  const { id } = await params;
  if (!ID_RE.test(id)) notFound();
  const user = await requireUser();
  const media = await prisma.media.findUnique({ where: { id }, include: { _count: { select: REFS } } });
  if (!media) notFound();
  const references = Object.values(media._count).reduce((a, b) => a + b, 0);
  const size = media.sizeBytes > 1024 * 1024 ? `${(media.sizeBytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(media.sizeBytes / 1024))} KB`;

  return (
    <>
      <PageHeader
        title={media.filename}
        crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Media library", href: "/admin/media" }]}
        badge={<Badge tone="neutral">{media.kind}</Badge>}
        description={`${media.mimeType} · ${size}${media.width && media.height ? ` · ${media.width}×${media.height}px` : ""} · uploaded ${formatDateTime(media.createdAt)} · used by ${references} item${references === 1 ? "" : "s"}`}
      />
      <MediaEditForm
        media={{
          id: media.id,
          url: media.url,
          kind: media.kind,
          alt: media.alt,
          caption: media.caption ?? "",
          credit: media.credit ?? "",
          focalX: media.focalX,
          focalY: media.focalY,
          tags: parseStringArray(media.tagsJson).join("\n"),
          usageStatus: media.usageStatus,
          consentStatus: media.consentStatus,
        }}
        canWrite={can(user.role, "media.update")}
        canDelete={can(user.role, "media.delete")}
      />
    </>
  );
}
