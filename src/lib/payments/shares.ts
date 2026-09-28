import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { SPLIT_WINDOW_HOURS, splitAmounts } from "@/lib/payments/split-math";

export {
  SPLIT_MAX_PEOPLE,
  SPLIT_MIN_PEOPLE,
  SPLIT_WINDOW_HOURS,
  validateSplitCount,
} from "@/lib/payments/split-math";

export type ShareStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "void"
  | "refund_due"
  | "refunded";

export type PaymentShare = {
  id: string;
  orderId: string;
  shareIndex: number;
  amount: number;
  token: string;
  payerName: string | null;
  payerEmail: string | null;
  status: ShareStatus;
  paidAt: string | null;
};

export type ShareOrderSummary = {
  id: string;
  orderNumber: string;
  organiserFirstName: string;
  organiserEmail: string;
  grandTotal: number;
  itemCount: number;
  status: string;
  paymentStatus: string;
  splitExpiresAt: string | null;
};

type ShareRow = {
  id: string;
  order_id: string;
  share_index: number;
  amount: number | string;
  token: string;
  payer_name: string | null;
  payer_email: string | null;
  status: string;
  paid_at: string | null;
};

const SHARE_COLUMNS =
  "id, order_id, share_index, amount, token, payer_name, payer_email, status, paid_at";

function db() {
  const client = createAdminClient();
  if (!client) throw new Error("Admin client not configured");
  return client;
}

function mapShare(row: ShareRow): PaymentShare {
  return {
    id: row.id,
    orderId: row.order_id,
    shareIndex: row.share_index,
    amount: Number(row.amount),
    token: row.token,
    payerName: row.payer_name,
    payerEmail: row.payer_email,
    status: row.status as ShareStatus,
    paidAt: row.paid_at,
  };
}

export async function createPaymentShares(
  orderId: string,
  total: number,
  count: number,
): Promise<PaymentShare[]> {
  const client = db();
  const expiresAt = new Date(
    Date.now() + SPLIT_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { error: orderError } = await client
    .from("orders")
    .update({ payment_mode: "split", split_expires_at: expiresAt })
    .eq("id", orderId);
  if (orderError) throw new Error(orderError.message);

  const rows = splitAmounts(total, count).map((amount, i) => ({
    order_id: orderId,
    share_index: i + 1,
    amount,
    token: randomBytes(18).toString("base64url"),
  }));

  const { data, error } = await client
    .from("order_payment_shares")
    .insert(rows)
    .select(SHARE_COLUMNS);
  if (error) throw new Error(error.message);
  return ((data ?? []) as ShareRow[]).map(mapShare);
}

export async function listSharesForOrder(orderId: string): Promise<PaymentShare[]> {
  const { data, error } = await db()
    .from("order_payment_shares")
    .select(SHARE_COLUMNS)
    .eq("order_id", orderId)
    .order("share_index", { ascending: true });
  if (error) return [];
  return ((data ?? []) as ShareRow[]).map(mapShare);
}

export async function getShareById(id: string): Promise<PaymentShare | null> {
  const { data } = await db()
    .from("order_payment_shares")
    .select(SHARE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return data ? mapShare(data as ShareRow) : null;
}

export async function getShareByToken(token: string): Promise<PaymentShare | null> {
  if (!token || token.length > 64) return null;
  const { data } = await db()
    .from("order_payment_shares")
    .select(SHARE_COLUMNS)
    .eq("token", token)
    .maybeSingle();
  return data ? mapShare(data as ShareRow) : null;
}

export async function getShareOrderSummary(
  orderId: string,
): Promise<ShareOrderSummary | null> {
  const { data } = await db()
    .from("orders")
    .select(
      "id, order_number, buyer, pricing, items, status, payment_status, split_expires_at",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!data) return null;
  const buyer = data.buyer as { fullName?: string; email?: string } | null;
  const pricing = data.pricing as { grandTotal?: number } | null;
  const items = (data.items as { quantity?: number }[] | null) ?? [];
  return {
    id: String(data.id),
    orderNumber: String(data.order_number),
    organiserFirstName: (buyer?.fullName ?? "A friend").trim().split(/\s+/)[0],
    organiserEmail: buyer?.email ?? "",
    grandTotal: Number(pricing?.grandTotal ?? 0),
    itemCount: items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0),
    status: String(data.status),
    paymentStatus: String(data.payment_status ?? "unpaid"),
    splitExpiresAt: (data.split_expires_at as string | null) ?? null,
  };
}

export async function markSharePending(
  shareId: string,
  payer: { name: string; email: string },
): Promise<void> {
  const { error } = await db()
    .from("order_payment_shares")
    .update({
      status: "pending",
      payer_name: payer.name,
      payer_email: payer.email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shareId)
    .in("status", ["unpaid", "pending"]);
  if (error) throw new Error(error.message);
}

export function isSplitExpired(summary: Pick<ShareOrderSummary, "splitExpiresAt">) {
  return Boolean(
    summary.splitExpiresAt &&
      new Date(summary.splitExpiresAt).getTime() < Date.now(),
  );
}
