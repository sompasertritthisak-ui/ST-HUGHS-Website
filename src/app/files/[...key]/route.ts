import { r2Bucket } from "@/lib/storage";

/**
 * GET /files/uploads/<name> — CMS uploads served from the R2 bucket by the site itself, so media needs no separate
 * public bucket domain (one origin to keep reachable). Only keys under uploads/ are served; names are unique per
 * upload, so responses are cached for a year. Off Workers there is no bucket and this answers 404 (local uploads
 * are served from public/uploads instead).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.join("/");
  if (!key.startsWith("uploads/") || parts.some((p) => p === ".." || p === "." || p === "")) {
    return new Response("Not found", { status: 404 });
  }
  const bucket = await r2Bucket();
  const object = await bucket?.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.httpEtag,
      "X-Content-Type-Options": "nosniff",
      // Uploaded files (an SVG, say) are shown, never run: no scripts, no navigation, even on the site's own origin.
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}
