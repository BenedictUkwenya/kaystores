import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOrderById } from "@/lib/orders/repository";
import { resendGiftRecipientEmail } from "@/lib/email/send";
import { getEmailSiteUrl } from "@/lib/site";
import { lagosToday } from "@/lib/orders/occasion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Email gift recipients on the occasion date the sender chose. */
export async function GET(request: Request) {
  if (!authorize(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) {
    return Response.json({ error: "Admin client not configured" }, { status: 500 });
  }

  const today = lagosToday();
  const { data, error } = await db
    .from("orders")
    .select("id")
    .eq("delivery_type", "gift")
    .eq("payment_status", "paid")
    .filter("gift->>recipientEmailOn", "eq", "date")
    .limit(80);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const row of data ?? []) {
    const order = await fetchOrderById(String(row.id));
    const gift = order?.gift;
    if (!order || !gift?.recipientEmail || !gift.occasionDate) continue;
    if (gift.recipientEmailSentAt) continue;
    if (gift.occasionDate > today) continue;

    const result = await resendGiftRecipientEmail(order, getEmailSiteUrl());
    if (result.ok) sent += 1;
  }

  return Response.json({ ok: true, sent });
}
