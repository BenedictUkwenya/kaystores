import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/env";

export function createBrowserSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured || !url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}

import { getSiteUrl } from "@/lib/site";

export function getAuthRedirectUrl(path = "/auth/callback") {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
