import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/env";

/** Server-only client for Edge Function invocation (not for browser). */
export function createAdminClient() {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isAdminConfigured(): boolean {
  return Boolean(
    getSupabaseConfig().isConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
