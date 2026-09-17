import "server-only";

/**
 * Media storage adapter.
 *
 * - Cloudflare Workers: files go to the R2 bucket bound as `MEDIA_BUCKET` and are
 *   served from `MEDIA_PUBLIC_URL` (the bucket's public domain, e.g.
 *   https://media.sthughs.edu.la). The returned URL is stored on the Media row.
 * - Local / VPS: files are written to `public/uploads` and served as `/uploads/<name>`.
 *
 * The rest of the app only uses `putObject` and `deleteObject`.
 */

/** Structural subset of Cloudflare's R2Bucket so we need no global worker types. */
type R2Like = {
  put(key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  delete(key: string): Promise<void>;
};

const isWorkersRuntime = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

export function mediaPublicUrl(): string {
  return (process.env.MEDIA_PUBLIC_URL ?? "").replace(/\/+$/, "");
}

async function r2Bucket(): Promise<R2Like | null> {
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
    if (!base) throw new Error("MEDIA_PUBLIC_URL is not set, so uploaded files could not be served. Set it to the R2 bucket's public domain.");
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
