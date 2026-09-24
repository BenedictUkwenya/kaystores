import { createAdminClient } from "@/lib/supabase/admin";
import { sendKayEmail } from "@/lib/email/send";
import { getEmailSiteUrl } from "@/lib/site";
import { nearestHubsForVendor } from "@/lib/shipping/hubs";
import { formatAddressLines } from "@/lib/orders/address";
import type { AddressDetails } from "@/types/order";
import type { VendorEmailHubOption } from "@/lib/email/types";

function admin() {
  const client = createAdminClient();
  if (!client) return null;
  return client;
}

function toHubOptions(
  hubs: Awaited<ReturnType<typeof nearestHubsForVendor>>,
): VendorEmailHubOption[] {
  return hubs.map((hub) => ({
    name: hub.name,
    phone: hub.contactPhone,
    address: formatAddressLines(hub.address).join(", "),
  }));
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
      "product_name, quantity, vendor_id, vendors(contact_name, contact_email, business_name, pickup_address)",
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
      pickupState: string | null;
      lines: string[];
    }
  >();

  for (const row of rows) {
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
    const vendorRow = Array.isArray(vendors) ? vendors[0] : vendors;
    if (!vendorRow?.contact_email) continue;

    const vendorId = String(row.vendor_id);
    const pickup =
      vendorRow.pickup_address && typeof vendorRow.pickup_address === "object"
        ? vendorRow.pickup_address
        : null;
    const entry = byVendor.get(vendorId) ?? {
      vendor: {
        contactName: vendorRow.contact_name,
        contactEmail: vendorRow.contact_email,
        businessName: vendorRow.business_name,
      },
      pickupState: pickup?.state?.trim() || null,
      lines: [],
    };
    entry.lines.push(`${row.product_name} × ${row.quantity}`);
    byVendor.set(vendorId, entry);
  }

  await Promise.all(
    [...byVendor.values()].map(async ({ vendor, pickupState, lines }) => {
      const hubs = await nearestHubsForVendor(pickupState, 2);
      return sendKayEmail({
        type: "vendor_new_order",
        appUrl: getEmailSiteUrl(),
        vendor,
        orderNumber: String(order.order_number),
        lineSummary: lines.join(", "),
        hubOptions: toHubOptions(hubs),
      });
    }),
  );
}

/** 12h fallback when vendor has not marked dispatched. */
export async function sendVendorHubDispatchReminder(input: {
  contactName: string;
  contactEmail: string;
  businessName: string;
  orderNumber: string;
  productName: string;
  pickupState?: string | null;
}): Promise<void> {
  const hubs = await nearestHubsForVendor(input.pickupState, 2);
  await sendKayEmail({
    type: "vendor_hub_dispatch_reminder",
    appUrl: getEmailSiteUrl(),
    vendor: {
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      businessName: input.businessName,
    },
    orderNumber: input.orderNumber,
    productName: input.productName,
    hubOptions: toHubOptions(hubs),
  });
}
