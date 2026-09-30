import { createAdminClient } from "@/lib/supabase/admin";
import { countSupportThreadsNeedingAttention } from "@/lib/support/repository";
import {
  countAdminTodo,
  countVendorTodo,
  loadAdminJobs,
  loadVendorJobs,
} from "@/lib/jobs";

/** Number = count badge; true = unread dot (e.g. a chat waiting on a reply). */
export type DashboardNavAttention = Partial<Record<string, number | boolean>>;

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

async function threadsAwaitingAdmin(
  db: NonNullable<ReturnType<typeof admin>>,
  table: "table_request_messages" | "order_support_messages",
): Promise<boolean> {
  const idColumn = table === "table_request_messages" ? "request_id" : "order_id";
  const { data } = await db
    .from(table)
    .select(`${idColumn}, channel, sender_role`)
    .order("created_at", { ascending: false })
    .limit(400);
  for (const role of latestSenders((data ?? []) as unknown as LatestMessageRow[]).values()) {
    if (role !== "admin") return true;
  }
  return false;
}

/** Prefer the count; fall back to a dot when only a chat is waiting. */
function countOrDot(count: number, dot: boolean): number | boolean {
  return count > 0 ? count : dot;
}

export async function fetchAdminNavAttention(): Promise<DashboardNavAttention> {
  const db = admin();
  if (!db) return {};

  const [jobs, support, kitchenChats, orderChats, payouts] = await Promise.all([
    loadAdminJobs(),
    countSupportThreadsNeedingAttention().catch(() => 0),
    threadsAwaitingAdmin(db, "table_request_messages").catch(() => false),
    threadsAwaitingAdmin(db, "order_support_messages").catch(() => false),
    db
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "approved"])
      .then((res) => res.count ?? 0),
  ]);
  const todo = countAdminTodo(jobs);

  return {
    "/admin": todo.total,
    "/admin/gifts": countOrDot(todo.gift, orderChats),
    "/admin/kitchen": countOrDot(todo.kitchen, kitchenChats),
    "/admin/concierge": todo.concierge,
    "/admin/support": support,
    "/admin/payouts": payouts,
  };
}

export async function fetchVendorNavAttention(
  vendorId: string,
): Promise<DashboardNavAttention> {
  const db = admin();
  const jobs = await loadVendorJobs(vendorId);

  let kitchenChat = false;
  if (db) {
    const ids = jobs
      .filter((job) => job.kind === "kitchen" && job.tab !== "done")
      .map((job) => job.id);
    if (ids.length) {
      const { data: messages } = await db
        .from("table_request_messages")
        .select("request_id, channel, sender_role")
        .in("request_id", ids)
        .eq("channel", "vendor")
        .order("created_at", { ascending: false })
        .limit(200);
      const latest = latestSenders((messages ?? []) as LatestMessageRow[]);
      kitchenChat = [...latest.values()].some((role) => role === "admin");
    }
  }

  return {
    "/vendor": countOrDot(countVendorTodo(jobs), kitchenChat),
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
