import { createAdminClient } from "@/lib/supabase/admin";
import { fetchConciergeQueueCounts } from "@/lib/concierge/dispatch";
import { fetchVendorOrderItems } from "@/lib/vendors/repository";

export type DashboardNavAttention = Partial<Record<string, boolean>>;

function admin() {
  const client = createAdminClient();
  if (!client) return null;
  return client;
}

export async function fetchAdminNavAttention(): Promise<DashboardNavAttention> {
  const db = admin();
  if (!db) return {};

  const [counts, ordersRes] = await Promise.all([
    fetchConciergeQueueCounts(),
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid")
      .in("status", ["confirmed", "processing", "pending_handover"]),
  ]);

  const conciergeAttention =
    counts.needsDispatch + counts.readyToRelease + counts.clientDeciding > 0;

  return {
    "/admin/concierge": conciergeAttention,
    "/admin/orders": (ordersRes.count ?? 0) > 0,
  };
}

export async function fetchVendorNavAttention(
  vendorId: string,
): Promise<DashboardNavAttention> {
  const db = admin();

  let pendingConcierge = 0;
  let activeConciergeJobs = 0;

  if (db) {
    const { data: assignments } = await db
      .from("concierge_vendor_assignments")
      .select("status, outcome, fulfilment_status")
      .eq("vendor_id", vendorId);

    for (const row of assignments ?? []) {
      if (row.status === "pending") pendingConcierge += 1;
      if (
        row.outcome === "selected" &&
        row.fulfilment_status !== "completed"
      ) {
        activeConciergeJobs += 1;
      }
    }
  }

  const orderItems = await fetchVendorOrderItems(vendorId).catch(() => []);
  const openOrders = orderItems.some(
    (item) => !["completed", "cancelled"].includes(item.fulfillmentStatus),
  );

  return {
    "/vendor/concierge": pendingConcierge > 0 || activeConciergeJobs > 0,
    "/vendor/orders": openOrders,
  };
}

export async function resolveAdminNavAttention(): Promise<DashboardNavAttention> {
  try {
    return await fetchAdminNavAttention();
  } catch {
    return {};
  }
}

export async function resolveVendorNavAttention(
  vendorId: string,
): Promise<DashboardNavAttention> {
  try {
    return await fetchVendorNavAttention(vendorId);
  } catch {
    return {};
  }
}
