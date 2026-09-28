import { createAdminClient } from "@/lib/supabase/admin";
import { fetchConciergeQueueCounts } from "@/lib/concierge/dispatch";
import { countSupportThreadsNeedingAttention } from "@/lib/support/repository";
import { fetchVendorOrderItems } from "@/lib/vendors/repository";

export type DashboardNavAttention = Partial<Record<string, boolean>>;

function admin() {
  const client = createAdminClient();
  if (!client) return null;
  return client;
}

type LatestMessageRow = {
  request_id?: string;
  order_id?: string;
  channel: string;
  sender_role: string;
};

/** Latest sender role per (thread, channel), from newest-first rows. */
function latestSenders(rows: LatestMessageRow[]): Map<string, string> {
  const latest = new Map<string, string>();
  for (const row of rows) {
    const key = `${row.request_id ?? row.order_id}:${row.channel}`;
    if (!latest.has(key)) latest.set(key, row.sender_role);
  }
  return latest;
}

async function kitchenNeedsAdmin(
  db: NonNullable<ReturnType<typeof admin>>,
): Promise<boolean> {
  const [newRequests, messages] = await Promise.all([
    db
      .from("table_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    db
      .from("table_request_messages")
      .select("request_id, channel, sender_role")
      .order("created_at", { ascending: false })
      .limit(400),
  ]);
  if ((newRequests.count ?? 0) > 0) return true;
  for (const role of latestSenders(
    (messages.data ?? []) as LatestMessageRow[],
  ).values()) {
    if (role !== "admin") return true;
  }
  return false;
}

async function orderChatsNeedAdmin(
  db: NonNullable<ReturnType<typeof admin>>,
): Promise<boolean> {
  const { data } = await db
    .from("order_support_messages")
    .select("order_id, channel, sender_role")
    .order("created_at", { ascending: false })
    .limit(400);
  for (const role of latestSenders((data ?? []) as LatestMessageRow[]).values()) {
    if (role !== "admin") return true;
  }
  return false;
}

async function overdueDispatchCount(
  db: NonNullable<ReturnType<typeof admin>>,
): Promise<number> {
  const { count } = await db
    .from("vendor_order_items")
    .select("id", { count: "exact", head: true })
    .eq("fulfillment_status", "awaiting_hub_delivery")
    .not("hub_reminder_sent_at", "is", null);
  return count ?? 0;
}

export async function fetchAdminNavAttention(): Promise<DashboardNavAttention> {
  const db = admin();
  if (!db) return {};

  const [counts, ordersRes, supportAttention, kitchen, orderChats, overdue] =
    await Promise.all([
      fetchConciergeQueueCounts(),
      db
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "paid")
        .in("status", ["confirmed", "processing", "pending_handover"]),
      countSupportThreadsNeedingAttention().catch(() => 0),
      kitchenNeedsAdmin(db).catch(() => false),
      orderChatsNeedAdmin(db).catch(() => false),
      overdueDispatchCount(db).catch(() => 0),
    ]);

  const conciergeAttention =
    counts.needsDispatch + counts.readyToRelease + counts.clientDeciding > 0;

  return {
    "/admin/concierge": conciergeAttention,
    "/admin/orders": (ordersRes.count ?? 0) > 0 || orderChats || overdue > 0,
    "/admin/support": supportAttention > 0,
    "/admin/table": kitchen,
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

  let kitchenAttention = false;
  if (db) {
    const { data: requests } = await db
      .from("table_requests")
      .select("id")
      .eq("assigned_vendor_id", vendorId)
      .not("status", "in", "(declined,fulfilled)");
    const ids = (requests ?? []).map((r) => String(r.id));
    if (ids.length) {
      const { data: messages } = await db
        .from("table_request_messages")
        .select("request_id, channel, sender_role")
        .in("request_id", ids)
        .eq("channel", "vendor")
        .order("created_at", { ascending: false })
        .limit(200);
      const latest = latestSenders((messages ?? []) as LatestMessageRow[]);
      kitchenAttention = [...latest.values()].some((role) => role === "admin");
    }
  }

  return {
    "/vendor/concierge": pendingConcierge > 0 || activeConciergeJobs > 0,
    "/vendor/orders": openOrders,
    "/vendor/table": kitchenAttention,
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
