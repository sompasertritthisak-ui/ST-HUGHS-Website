import path from "node:path";
import type { NextConfig } from "next";

/**
 * Content-Security-Policy: what a page may load and where it may send data, so an injected script cannot pull code
 * from or post data to another site. Inline scripts stay allowed ('unsafe-inline'): Next.js inlines its page data,
 * and per-request nonces would make every page uncacheable. Third parties: Google Translate (header menu), YouTube /
 * Vimeo / map embeds (iframes), and https images (Unsplash placeholders, CMS links).
 */
const GOOGLE_TRANSLATE = "https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://www.gstatic.com";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${GOOGLE_TRANSLATE}`,
  `style-src 'self' 'unsafe-inline' ${GOOGLE_TRANSLATE} https://fonts.googleapis.com`, // Translate loads a Lao font
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "media-src 'self' blob: https:",
  `connect-src 'self' ${GOOGLE_TRANSLATE}`,
  "frame-src 'self' https:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** Public host of the R2 media bucket (uploads), when configured. */
function mediaHost(): string | undefined {
  try {
    return process.env.MEDIA_PUBLIC_URL ? new URL(process.env.MEDIA_PUBLIC_URL).hostname : undefined;
  } catch {
    return undefined;
  }
}

/** One id per build, inlined into the pages and /api/version, so an open tab can tell a newer deploy is live
 *  (see src/components/site/deploy-guard.tsx). */
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || `${Date.now().toString(36)}-${(process.env.WORKERS_CI_COMMIT_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? "local").slice(0, 7)}`;

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  reactStrictMode: true,
  poweredByHeader: false,
  // A stray lockfile in the home folder otherwise makes Next guess the wrong workspace root.
  turbopack: { root: path.resolve(process.cwd()) },
  // Prisma's generated client must stay external so OpenNext can patch it for Workers.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  images: {
    // Cloudflare has no built-in optimiser; see src/lib/image-loader.ts.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [400, 640, 768, 1024, 1280, 1536, 1920],
    remotePatterns: mediaHost() ? [{ protocol: "https", hostname: mediaHost()! }] : [],
  },
  experimental: {
    serverActions: { bodySizeLimit: "30mb" },
    // Pre-rendering 44 CMS-driven pages hammers the database; keep the fan-out
    // modest and retry a page instead of failing the whole build on a slow query.
    staticGenerationMaxConcurrency: 4,
    staticGenerationRetryCount: 3,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
