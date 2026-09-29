import { createAdminClient } from "@/lib/supabase/admin";
import { sendVendorHubDispatchReminder } from "@/lib/email/vendor-orders";
import { sendNotice } from "@/lib/email/notice";
import { getEmailSiteUrl } from "@/lib/site";
import type { AddressDetails } from "@/types/order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOUR_MS = 60 * 60 * 1000;
/** Reminder n (1-based) is due this long after payment. */
const REMINDER_DUE_MS = [12 * HOUR_MS, 24 * HOUR_MS];

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

type VendorRow = {
  contact_name: string;
  contact_email: string;
  business_name: string;
  pickup_address: AddressDetails | null;
};

type OrderRow = {
  order_number: string;
  paid_at: string | null;
  updated_at: string | null;
};

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Vendors who have not dispatched to a hub after payment:
 * 12h → vendor reminder + admin alert, 24h → second reminder + admin alert.
 * Secure with CRON_SECRET (Authorization: Bearer …).
 */
export async function GET(request: Request) {
  if (!authorize(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ error: "Admin client not configured" }, { status: 500 });
  }

  const { data: rows, error } = await admin
    .from("vendor_order_items")
    .select(
      "id, product_name, updated_at, created_at, order_id, hub_reminder_count, vendors(contact_name, contact_email, business_name, pickup_address), orders(order_number, paid_at, updated_at)",
    )
    .eq("fulfillment_status", "awaiting_hub_delivery")
    .is("vendor_dispatched_at", null)
    .lt("hub_reminder_count", REMINDER_DUE_MS.length)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  let sent = 0;
  const errors: string[] = [];
  const overdue: { line: string; orderId: string }[] = [];

  for (const row of rows ?? []) {
    const order = one(row.orders as OrderRow | OrderRow[] | null);
    const vendor = one(row.vendors as VendorRow | VendorRow[] | null);
    if (!order || !vendor?.contact_email) continue;

    const count = Number(row.hub_reminder_count ?? 0);
    const dueAfter = REMINDER_DUE_MS[count];
    if (dueAfter === undefined) continue;

    const paidAt =
      order.paid_at || order.updated_at || row.updated_at || row.created_at;
    if (!paidAt) continue;
    const elapsed = now - new Date(String(paidAt)).getTime();
    if (elapsed < dueAfter) continue;

    try {
      const pickup =
        vendor.pickup_address && typeof vendor.pickup_address === "object"
          ? vendor.pickup_address
          : null;
      await sendVendorHubDispatchReminder({
        contactName: vendor.contact_name,
        contactEmail: vendor.contact_email,
        businessName: vendor.business_name,
        orderNumber: String(order.order_number),
        productName: String(row.product_name),
        pickupState: pickup?.state ?? null,
      });
      const stamp = new Date().toISOString();
      await admin
        .from("vendor_order_items")
        .update({
          hub_reminder_count: count + 1,
          hub_reminder_sent_at: stamp,
          updated_at: stamp,
        })
        .eq("id", row.id);
      sent += 1;
      overdue.push({
        orderId: String(row.order_id),
        line: `Order #${order.order_number} — ${row.product_name} from ${vendor.business_name} (${Math.floor(elapsed / HOUR_MS)}h since payment, reminder ${count + 1} of ${REMINDER_DUE_MS.length} sent)`,
      });
    } catch (err) {
      errors.push(
        `${row.id}: ${err instanceof Error ? err.message : "failed"}`,
      );
    }
  }

  if (overdue.length > 0) {
    await sendNotice({
      type: "vendor_dispatch_overdue",
      toTeam: true,
      subject:
        overdue.length === 1
          ? "A vendor hasn't dispatched to the hub yet"
          : `${overdue.length} vendors haven't dispatched to the hub yet`,
      title: "Hub dispatch overdue",
      paragraphs: [
        "These paid items are still waiting to be dropped at a Kay hub. We've emailed the vendor a reminder — you may want to call them.",
        ...overdue.map((o) => o.line),
      ],
      ctaUrl:
        overdue.length === 1
          ? `${getEmailSiteUrl()}/admin/orders/${overdue[0].orderId}`
          : `${getEmailSiteUrl()}/admin/orders`,
      ctaLabel: "Open orders",
    });
  }

  return Response.json({ ok: true, sent, checked: rows?.length ?? 0, errors });
}
