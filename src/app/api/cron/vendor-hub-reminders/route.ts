import { createAdminClient } from "@/lib/supabase/admin";
import { sendVendorHubDispatchReminder } from "@/lib/email/vendor-orders";
import type { AddressDetails } from "@/types/order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * 12h fallback: remind vendors who have not marked dispatched after payment.
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

  const cutoff = new Date(Date.now() - TWELVE_HOURS_MS).toISOString();

  const { data: rows, error } = await admin
    .from("vendor_order_items")
    .select(
      "id, product_name, updated_at, created_at, order_id, vendors(contact_name, contact_email, business_name, pickup_address), orders(order_number, paid_at, updated_at)",
    )
    .eq("fulfillment_status", "awaiting_hub_delivery")
    .is("hub_reminder_sent_at", null)
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const row of rows ?? []) {
    const orders = row.orders as
      | {
          order_number: string;
          paid_at: string | null;
          updated_at: string | null;
        }
      | {
          order_number: string;
          paid_at: string | null;
          updated_at: string | null;
        }[]
      | null;
    const order = Array.isArray(orders) ? orders[0] : orders;
    const vendors = row.vendors as
      | {
          contact_name: string;
          contact_email: string;
          business_name: string;
          pickup_address: AddressDetails | null;
        }
      | {
          contact_name: string;
          contact_email: string;
          business_name: string;
          pickup_address: AddressDetails | null;
        }[]
      | null;
    const vendor = Array.isArray(vendors) ? vendors[0] : vendors;
    if (!order || !vendor?.contact_email) continue;

    const paidAt =
      order.paid_at || order.updated_at || row.updated_at || row.created_at;
    if (!paidAt || paidAt > cutoff) continue;

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
      await admin
        .from("vendor_order_items")
        .update({
          hub_reminder_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      sent += 1;
    } catch (err) {
      errors.push(
        `${row.id}: ${err instanceof Error ? err.message : "failed"}`,
      );
    }
  }

  return Response.json({ ok: true, sent, checked: rows?.length ?? 0, errors });
}
