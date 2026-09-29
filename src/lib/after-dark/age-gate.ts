/** HttpOnly cookie — set only by POST /api/after-dark/verify-age */
export const AFTER_DARK_AGE_COOKIE = "kay_ad_age";

/** Client localStorage mirror (legacy); cookie is authoritative for SSR. */
export const AFTER_DARK_AGE_LOCAL_KEY = "kay-after-dark-age-verified";

export const AFTER_DARK_AGE_MAX_AGE_SEC = 60 * 60 * 24 * 180;

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export function isAfterDarkAgeVerified(cookies: CookieReader): boolean {
  return cookies.get(AFTER_DARK_AGE_COOKIE)?.value === "1";
}

export function isAfterDarkPath(pathname: string): boolean {
  return pathname === "/after-dark" || pathname.startsWith("/after-dark/");
}

/** Catalogue routes that must not render product data without the age cookie. */
export function requiresAfterDarkAgeCookie(pathname: string): boolean {
  return (
    pathname.startsWith("/after-dark/products") ||
    pathname.startsWith("/after-dark/search")
  );
}
