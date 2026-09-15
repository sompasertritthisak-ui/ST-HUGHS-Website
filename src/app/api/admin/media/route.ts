import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { MEDIA_KINDS } from "@/lib/enums";
import { imageDimensions } from "./dimensions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;

/** Allowlisted MIME types → safe extension + Media.kind. SVG is rejected (script risk). */
const ALLOWED: Record<string, { ext: string; kind: string }> = {
  "image/jpeg": { ext: "jpg", kind: "IMAGE" },
  "image/png": { ext: "png", kind: "IMAGE" },
  "image/webp": { ext: "webp", kind: "IMAGE" },
  "image/avif": { ext: "avif", kind: "IMAGE" },
  "video/mp4": { ext: "mp4", kind: "VIDEO" },
  "application/pdf": { ext: "pdf", kind: "PDF" },
};

/** GET — media list for the picker. Requires media.read. */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !can(session.user.role, "media.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const kinds = (url.searchParams.get("kinds") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter((k) => MEDIA_KINDS.includes(k as (typeof MEDIA_KINDS)[number]));
  const items = await prisma.media.findMany({
    where: {
      ...(kinds.length ? { kind: { in: kinds } } : {}),
      ...(q ? { OR: [{ filename: { contains: q } }, { alt: { contains: q } }, { tagsJson: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, url: true, alt: true, kind: true, filename: true },
  });
  return NextResponse.json({ items });
}

/** POST multipart/form-data { file } — upload one file. Requires media.upload. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !can(session.user.role, "media.upload")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const ip = clientIp(request.headers);
  if (!rateLimit(`upload:${session.user.id}`, 60, 10 * 60 * 1000).ok) return NextResponse.json({ error: "Too many uploads. Try again shortly." }, { status: 429 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "File is empty." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is larger than 25 MB." }, { status: 413 });
  const spec = ALLOWED[file.type];
  if (!spec) return NextResponse.json({ error: "File type not allowed. Use JPEG, PNG, WebP, AVIF, MP4 or PDF." }, { status: 415 });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!sniffMatches(bytes, file.type)) return NextResponse.json({ error: "File contents do not match its type." }, { status: 415 });

  const name = `${randomUUID()}.${spec.ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes, { flag: "wx" });

  const dims = spec.kind === "IMAGE" ? imageDimensions(bytes, file.type) : null;
  const originalName = file.name.replace(/[^\w.\- ]+/g, "").slice(0, 120) || name;
  const media = await prisma.media.create({
    data: {
      kind: spec.kind,
      url: `/uploads/${name}`,
      filename: originalName,
      mimeType: file.type,
      sizeBytes: file.size,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      alt: "",
      usageStatus: "INTERNAL",
      consentStatus: "NOT_REQUIRED",
    },
  });
  await recordAudit({ actorId: session.user.id, action: "UPLOAD", entityType: "Media", entityId: media.id, afterJson: JSON.stringify(media), ip });
  return NextResponse.json({ id: media.id, url: media.url, filename: media.filename, kind: media.kind, alt: media.alt }, { status: 201 });
}

/** Cheap magic-number check so a renamed file cannot pass as an allowed type. */
function sniffMatches(b: Buffer, mime: string) {
  const ascii = (from: number, to: number) => b.subarray(from, to).toString("latin1");
  switch (mime) {
    case "image/jpeg":
      return b[0] === 0xff && b[1] === 0xd8;
    case "image/png":
      return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "image/avif":
      return ascii(4, 8) === "ftyp";
    case "video/mp4":
      return ascii(4, 8) === "ftyp";
    case "application/pdf":
      return ascii(0, 5) === "%PDF-";
    default:
      return false;
  }
}
