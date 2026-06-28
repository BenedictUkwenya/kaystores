import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { SITE_ROUTES } from "@/lib/data/site-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/gifts",
    "/concierge",
    "/compare",
    SITE_ROUTES.about,
    SITE_ROUTES.faqs,
    SITE_ROUTES.deliveryReturns,
    SITE_ROUTES.contact,
    SITE_ROUTES.trackOrder,
    SITE_ROUTES.privacy,
    SITE_ROUTES.terms,
    "/login",
    "/signup",
  ];

  return routes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
