import type { MetadataRoute } from "next";
import { absolute, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: absolute("/sitemap.xml"),
    host: siteUrl(),
  };
}
