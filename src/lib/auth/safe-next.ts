const DEFAULT_NEXT = "/account";

/**
 * Only allow same-origin relative paths for post-auth redirects.
 * Rejects absolute URLs, protocol-relative ("//host") and backslash
 * variants ("/\host") that browsers treat as external.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_NEXT,
): string {
  if (typeof next !== "string") return fallback;
  const value = next.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}
