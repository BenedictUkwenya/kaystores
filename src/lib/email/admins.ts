import { createAdminClient } from "@/lib/supabase/admin";

/** Emails for every active admin account (auth users with profiles.role = admin). */
export async function listAdminEmails(): Promise<string[]> {
  const db = createAdminClient();
  if (!db) return [];

  const { data: profiles, error } = await db
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (error || !profiles?.length) return [];

  const emails: string[] = [];
  for (const row of profiles) {
    const { data } = await db.auth.admin.getUserById(String(row.id));
    const email = data.user?.email?.trim().toLowerCase();
    if (email) emails.push(email);
  }

  return [...new Set(emails)];
}
