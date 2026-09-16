import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Media storage adapter.
 *
 * - Local / VPS: files are written to `public/uploads` and served as `/uploads/<name>`.
 * - Vercel (read-only filesystem): when `BLOB_READ_WRITE_TOKEN` is set, files go to
 *   Vercel Blob (public access) and the returned URL is stored on the Media row.
 *
 * Swap this module for S3/R2 if needed — the rest of the app only uses these two calls.
 */

export function usingBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function putObject(name: string, bytes: Buffer, contentType: string): Promise<{ url: string }> {
  if (usingBlobStorage()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${name}`, bytes, { access: "public", contentType, addRandomSuffix: false });
    return { url: blob.url };
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes, { flag: "wx" });
  return { url: `/uploads/${name}` };
}

export async function deleteObject(url: string): Promise<void> {
  if (url.startsWith("/uploads/")) {
    const file = path.join(process.cwd(), "public", "uploads", path.basename(url));
    await unlink(file).catch(() => undefined);
    return;
  }
  if (/\.blob\.vercel-storage\.com\//.test(url) && usingBlobStorage()) {
    const { del } = await import("@vercel/blob");
    await del(url).catch(() => undefined);
  }
}
