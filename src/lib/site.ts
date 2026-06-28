export const siteConfig = {
  name: "Kay Stores",
  title: "Kay Stores — Luxury Gifting",
  tagline: "Thoughtful gifts, beautifully curated.",
  description:
    "Discover luxury gifts for every occasion. Kay AI curation, concierge sourcing, gifting checkout with anonymous delivery, and Kay After Dark.",
  locale: "en_NG",
  twitterHandle: "@kaystores",
} as const;

/** Absolute site URL for metadata, OG tags, and auth redirects. */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function absoluteUrl(path = ""): string {
  const base = getSiteUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
