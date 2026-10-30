import "server-only";

/**
 * Media storage adapter.
 *
 * - Cloudflare Workers: files go to the R2 bucket bound as `MEDIA_BUCKET` and are
 *   served from `MEDIA_PUBLIC_URL` (the bucket's public domain, e.g.
 *   https://media.sthughs.edu.la) or, when that is not set, by the site itself at
 *   /files/uploads/<name> (src/app/files/[...key]/route.ts) — same origin, so no
 *   extra domain has to be reachable. The returned URL is stored on the Media row.
 * - Local / VPS: files are written to `public/uploads` and served as `/uploads/<name>`.
 *
 * The rest of the app only uses `putObject` and `deleteObject`.
 */

/** Structural subset of Cloudflare's R2Bucket so we need no global worker types. */
type R2Like = {
  get(key: string): Promise<{ body: ReadableStream; httpEtag: string; httpMetadata?: { contentType?: string } } | null>;
  put(key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  delete(key: string): Promise<void>;
};

const isWorkersRuntime = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

/** Where the site serves R2 files itself when MEDIA_PUBLIC_URL is not set. */
export const FILES_ROUTE = "/files";

export function mediaPublicUrl(): string {
  return (process.env.MEDIA_PUBLIC_URL ?? "").replace(/\/+$/, "") || FILES_ROUTE;
}

export async function r2Bucket(): Promise<R2Like | null> {
  if (!isWorkersRuntime) return null;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const bucket = (env as unknown as Record<string, unknown>).MEDIA_BUCKET as R2Like | undefined;
    return bucket ?? null;
  } catch {
    return null;
  }
}

export async function usingObjectStorage(): Promise<boolean> {
  return (await r2Bucket()) !== null;
}

export async function putObject(name: string, bytes: Buffer, contentType: string): Promise<{ url: string }> {
  const bucket = await r2Bucket();
  if (bucket) {
    const base = mediaPublicUrl();
    await bucket.put(`uploads/${name}`, bytes, { httpMetadata: { contentType } });
    return { url: `${base}/uploads/${name}` };
  }
  const [{ mkdir, writeFile }, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes, { flag: "wx" });
  return { url: `/uploads/${name}` };
}

export async function deleteObject(url: string): Promise<void> {
  if (url.startsWith("/uploads/")) {
    const [{ unlink }, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
    await unlink(path.join(process.cwd(), "public", "uploads", path.basename(url))).catch(() => undefined);
    return;
  }
  const base = mediaPublicUrl();
  if (base && url.startsWith(`${base}/`)) {
    const bucket = await r2Bucket();
    await bucket?.delete(url.slice(base.length + 1)).catch(() => undefined);
  }
}
