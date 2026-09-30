import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapOrderRow, type OrderRow } from "@/lib/orders/map";
import { fetchOrderById } from "@/lib/orders/repository";
import {
  getTableRequestById,
  listTableRequests,
  toVendorSafeRequest,
} from "@/lib/table/repository";
import {
  fetchConciergeRequestWithAssignments,
  fetchConciergeRequestsWithAssignments,
  fetchVendorConciergeAssignments,
} from "@/lib/concierge/dispatch";
import { getMarkupTiers } from "@/lib/pricing/markup";
import { giftJob, giftVendorJob, mapGiftLine, type GiftLine } from "@/lib/jobs/gift";
import { kitchenJob, kitchenVendorJob } from "@/lib/jobs/kitchen";
import { conciergeJob, conciergeVendorJob } from "@/lib/jobs/concierge";
import type { Job, JobKind, JobUrgency, VendorJob } from "@/lib/jobs/types";

export * from "@/lib/jobs/types";

const RECENT_LIMIT = 300;

function db() {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured.");
  return client;
}

async function linesForOrders(orderIds: string[]): Promise<Map<string, GiftLine[]>> {
  const byOrder = new Map<string, GiftLine[]>();
  for (let i = 0; i < orderIds.length; i += 100) {
    const chunk = orderIds.slice(i, i + 100);
    const { data, error } = await db()
      .from("vendor_order_items")
      .select("*, vendors(business_name)")
      .in("order_id", chunk);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      const line = mapGiftLine(row as Record<string, unknown>);
      const list = byOrder.get(line.orderId) ?? [];
      list.push(line);
      byOrder.set(line.orderId, list);
    }
  }
  return byOrder;
}

async function loadGiftJobs(): Promise<Job[]> {
  const { data, error } = await db()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);
  if (error) throw new Error(error.message);
  const orders = (data ?? []).map((row) => mapOrderRow(row as OrderRow));
  const lines = await linesForOrders(orders.map((o) => o.id));
  return orders.map((order) => giftJob(order, lines.get(order.id) ?? []));
}

async function loadKitchenJobs(): Promise<Job[]> {
  const requests = await listTableRequests({ limit: RECENT_LIMIT });
  return requests.map(kitchenJob);
}

async function loadConciergeJobs(): Promise<Job[]> {
  const [{ requests }, tiers] = await Promise.all([
    fetchConciergeRequestsWithAssignments({ skipPagination: true }),
    getMarkupTiers(),
  ]);
  return requests.slice(0, RECENT_LIMIT).map((r) => conciergeJob(r, tiers));
}

function logged<T>(label: string, fallback: T) {
  return (err: unknown) => {
    console.error(`[jobs] ${label}`, err);
    return fallback;
  };
}

/** Every recent job across gifts, kitchen and concierge. Cached per request. */
export const loadAdminJobs = cache(async (): Promise<Job[]> => {
  const [gifts, kitchen, concierge] = await Promise.all([
    loadGiftJobs().catch(logged("gifts", [] as Job[])),
    loadKitchenJobs().catch(logged("kitchen", [] as Job[])),
    loadConciergeJobs().catch(logged("concierge", [] as Job[])),
  ]);
  return sortJobs([...gifts, ...kitchen, ...concierge]);
});

export async function getAdminJob(kind: JobKind, id: string): Promise<Job | null> {
  if (kind === "gift") {
    const order = await fetchOrderById(id);
    if (!order) return null;
    const lines = await linesForOrders([id]);
    return giftJob(order, lines.get(id) ?? []);
  }
  if (kind === "kitchen") {
    const request = await getTableRequestById(id);
    return request ? kitchenJob(request) : null;
  }
  const [request, tiers] = await Promise.all([
    fetchConciergeRequestWithAssignments(id),
    getMarkupTiers(),
  ]);
  return request ? conciergeJob(request, tiers) : null;
}

export async function loadGiftLines(orderId: string): Promise<GiftLine[]> {
  return (await linesForOrders([orderId])).get(orderId) ?? [];
}

const URGENCY_RANK: Record<JobUrgency, number> = { overdue: 0, soon: 1, normal: 2 };

/** Most urgent first; among equals, the one that's been waiting longest. */
export function sortJobs<T extends { urgency: JobUrgency; createdAt: string }>(
  jobs: T[],
): T[] {
  return [...jobs].sort((a, b) => {
    const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    if (u !== 0) return u;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function isActiveJob(job: Pick<Job, "stage" | "actor">): boolean {
  return !(job.stage === "done" || (job.stage === "cancelled" && job.actor === "none"));
}

export type AdminTodoCounts = Record<JobKind, number> & { total: number };

export function countAdminTodo(jobs: Job[]): AdminTodoCounts {
  const counts: AdminTodoCounts = { gift: 0, kitchen: 0, concierge: 0, total: 0 };
  for (const job of jobs) {
    if (job.actor !== "admin") continue;
    counts[job.kind] += 1;
    counts.total += 1;
  }
  return counts;
}

async function loadVendorGiftJobs(vendorId: string, itemId?: string): Promise<VendorJob[]> {
  let query = db()
    .from("vendor_order_items")
    .select("*, vendors(business_name), orders(order_number, payment_status, status)")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);
  if (itemId) query = query.eq("id", itemId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const line = mapGiftLine(row as Record<string, unknown>);
    // Unpaid checkouts aren't the vendor's business until money lands.
    if (!itemId && line.fulfillmentStatus === "awaiting_payment") return [];
    const order = (row as { orders?: Record<string, unknown> | null }).orders;
    return [
      giftVendorJob(line, {
        orderNumber: String(order?.order_number ?? ""),
        paymentStatus: order?.payment_status as string | undefined,
        status: order?.status as string | undefined,
      }),
    ];
  });
}

async function loadVendorKitchenJobs(vendorId: string): Promise<VendorJob[]> {
  const requests = await listTableRequests({ vendorId, limit: RECENT_LIMIT });
  return requests.map((r) => kitchenVendorJob(toVendorSafeRequest(r)));
}

async function loadVendorConciergeJobs(vendorId: string): Promise<VendorJob[]> {
  const rows = await fetchVendorConciergeAssignments(vendorId);
  return rows.map(({ assignment, request }) => conciergeVendorJob(assignment, request));
}

export const loadVendorJobs = cache(async (vendorId: string): Promise<VendorJob[]> => {
  const [gifts, kitchen, concierge] = await Promise.all([
    loadVendorGiftJobs(vendorId).catch(logged("vendor gifts", [] as VendorJob[])),
    loadVendorKitchenJobs(vendorId).catch(logged("vendor kitchen", [] as VendorJob[])),
    loadVendorConciergeJobs(vendorId).catch(logged("vendor concierge", [] as VendorJob[])),
  ]);
  return sortJobs([...gifts, ...kitchen, ...concierge]);
});

export async function getVendorJob(
  kind: JobKind,
  id: string,
  vendorId: string,
): Promise<VendorJob | null> {
  if (kind === "gift") {
    return (await loadVendorGiftJobs(vendorId, id))[0] ?? null;
  }
  if (kind === "kitchen") {
    const request = await getTableRequestById(id);
    if (!request || request.assignedVendorId !== vendorId) return null;
    return kitchenVendorJob(toVendorSafeRequest(request));
  }
  const rows = await fetchVendorConciergeAssignments(vendorId, id);
  const row = rows[0];
  return row ? conciergeVendorJob(row.assignment, row.request) : null;
}

export function countVendorTodo(jobs: VendorJob[]): number {
  return jobs.filter((job) => job.tab === "todo").length;
}
