import { createAdminClient } from "@/lib/supabase/admin";
import { sendKayEmail } from "@/lib/email/send";
import { getEmailSiteUrl } from "@/lib/site";

function admin() {
  const client = createAdminClient();
  if (!client) return null;
  return client;
}

export async function notifyVendorsForPaidOrder(orderId: string): Promise<void> {
  const db = admin();
  if (!db) return;

  const { data: order } = await db
    .from("orders")
    .select("order_number")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return;

  const { data: rows } = await db
    .from("vendor_order_items")
    .select(
      "product_name, quantity, vendor_id, vendors(contact_name, contact_email, business_name)",
    )
    .eq("order_id", orderId);

  if (!rows?.length) return;

  const byVendor = new Map<
    string,
    {
      vendor: {
        contactName: string;
        contactEmail: string;
        businessName: string;
      };
      lines: string[];
    }
  >();

  for (const row of rows) {
    const vendors = row.vendors as
      | {
          contact_name: string;
          contact_email: string;
          business_name: string;
        }
      | {
          contact_name: string;
          contact_email: string;
          business_name: string;
        }[]
      | null;
    const vendorRow = Array.isArray(vendors) ? vendors[0] : vendors;
    if (!vendorRow?.contact_email) continue;

    const vendorId = String(row.vendor_id);
    const entry = byVendor.get(vendorId) ?? {
      vendor: {
        contactName: vendorRow.contact_name,
        contactEmail: vendorRow.contact_email,
        businessName: vendorRow.business_name,
      },
      lines: [],
    };
    entry.lines.push(`${row.product_name} × ${row.quantity}`);
    byVendor.set(vendorId, entry);
  }

  for (const { vendor, lines } of byVendor.values()) {
    void sendKayEmail({
      type: "vendor_new_order",
      appUrl: getEmailSiteUrl(),
      vendor,
      orderNumber: String(order.order_number),
      lineSummary: lines.join(", "),
    });
  }
}
