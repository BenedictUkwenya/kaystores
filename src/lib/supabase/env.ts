export function getSupabaseConfig() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  let url = rawUrl;
  // Relative or host-only values make the browser call kaystores.vercel.app/auth/...
  // and return HTML 404s that surface as "Unexpected token '<' ... is not valid JSON".
  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/+/, "")}`;
  }

  const isAbsoluteHttp =
    Boolean(url) &&
    (() => {
      try {
        const parsed = new URL(url);
        return (
          (parsed.protocol === "https:" || parsed.protocol === "http:") &&
          Boolean(parsed.hostname) &&
          !parsed.hostname.includes("vercel.app")
        );
      } catch {
        return false;
      }
    })();

  return {
    url: isAbsoluteHttp ? url.replace(/\/$/, "") : undefined,
    anonKey: anonKey || undefined,
    isConfigured: Boolean(isAbsoluteHttp && anonKey),
  };
}
