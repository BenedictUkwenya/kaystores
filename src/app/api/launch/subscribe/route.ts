import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ error: "Reminders are not available right now." }, { status: 503 });
  }

  const { error } = await admin
    .from("launch_subscribers")
    .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
  if (error) {
    console.error("[launch_subscribers]", error.message);
    return Response.json({ error: "Could not save your email." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
