import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/vendor",
        "/api",
        "/order",
        "/checkout",
        "/account",
        "/split",
        "/reveal",
        "/handover",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
