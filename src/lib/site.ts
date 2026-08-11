export const siteConfig = {
  name: "Kay Stores",
  title: "Kay Stores — Luxury Gifting",
  tagline: "Thoughtful gifts, beautifully curated.",
  description:
    "Discover luxury gifts for every occasion. Kay AI curation, concierge sourcing, gifting checkout with anonymous delivery, and Kay After Dark.",
  locale: "en_NG",
  twitterHandle: "@kaystores",
} as const;

const LOCAL_APP_URL =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

/** Production fallback when local env would otherwise leak into emails. */
const PRODUCTION_SITE_URL = "https://shoponkay.com";

/** Absolute site URL for metadata, OG tags, and auth redirects. */
export function getSiteUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (appUrl && !LOCAL_APP_URL.test(appUrl)) {
    return appUrl;
  }

  // Prefer the custom domain over Vercel project / preview hosts.
  // Preview URLs often return HTML to WhatsApp/Facebook crawlers instead of og:image assets.
  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (appUrl) {
    return appUrl;
  }

  return "http://localhost:3000";
}

/**
 * Site URL for transactional emails. Never returns localhost — Gmail/Outlook
 * often strip or hide localhost links, and invites must open the live app.
 */
export function getEmailSiteUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (appUrl && !LOCAL_APP_URL.test(appUrl)) {
    return appUrl;
  }

  return PRODUCTION_SITE_URL;
}

export function absoluteUrl(path = ""): string {
  const base = getSiteUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
