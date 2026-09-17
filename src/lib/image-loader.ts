import type { ImageLoaderProps } from "next/image";

/**
 * next/image loader for Cloudflare.
 *
 * Cloudflare Workers have no built-in image optimiser, so by default the original
 * file is served (site photography is already exported at sensible sizes). When
 * the zone has Images → Transformations enabled, set NEXT_PUBLIC_CF_IMAGE_TRANSFORMS=1
 * and every image is resized and converted (AVIF/WebP) on Cloudflare's edge via
 * `/cdn-cgi/image/...`.
 */
export default function cloudflareImageLoader({ src, width, quality }: ImageLoaderProps): string {
  const transforms = process.env.NEXT_PUBLIC_CF_IMAGE_TRANSFORMS === "1" && process.env.NODE_ENV !== "development";
  if (!transforms) return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  const params = [`width=${width}`, `quality=${quality ?? 80}`, "format=auto", "fit=scale-down"].join(",");
  return `/cdn-cgi/image/${params}/${src.startsWith("/") ? src.slice(1) : src}`;
}
