import { createAdminClient } from "@/lib/supabase/admin";
import { restoreStockForOrder } from "@/lib/products/stock";
import { listSharesForOrder } from "@/lib/payments/shares";
import { sendNotice } from "@/lib/email/notice";
import { formatNaira } from "@/lib/data/home";
import { getEmailSiteUrl } from "@/lib/site";
import type { OrderItem } from "@/types/order";
import { adminCancel } from "@/lib/orders/admin-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Cancel split orders whose share window ran out: release stock, close
 * open shares, flag paid shares for manual refund, email organiser + team.
 */
export async function GET(request: Request) {
  if (!authorize(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) {
    return Response.json({ error: "Admin client not configured" }, { status: 500 });
  }

  const { data: orders, error } = await db
    .from("orders")
    .select("id, order_number, items, buyer")
    .eq("payment_mode", "split")
    .neq("payment_status", "paid")
    .neq("status", "cancelled")
    .lt("split_expires_at", new Date().toISOString())
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let cancelled = 0;
  const errors: string[] = [];

  for (const order of orders ?? []) {
    try {
      const { data: claimed } = await db
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id)
        .neq("payment_status", "paid")
        .neq("status", "cancelled")
        .select("id");
      if (!claimed?.length) continue;

      await restoreStockForOrder((order.items as OrderItem[]) ?? []);
      await db
        .from("vendor_order_items")
        .update({ fulfillment_status: "cancelled", updated_at: new Date().toISOString() })
        .eq("order_id", order.id);
      await db
        .from("order_payment_shares")
        .update({ status: "void", updated_at: new Date().toISOString() })
        .eq("order_id", order.id)
        .in("status", ["unpaid", "pending"]);
      await db
        .from("order_payment_shares")
        .update({ status: "refund_due", updated_at: new Date().toISOString() })
        .eq("order_id", order.id)
        .eq("status", "paid");

      const shares = await listSharesForOrder(String(order.id));
      const refunds = shares.filter((s) => s.status === "refund_due");
      const refundLines = refunds.map(
        (s) =>
          `${s.payerName || s.payerEmail || `Person ${s.shareIndex}`} — ${formatNaira(s.amount)}${s.payerEmail ? ` (${s.payerEmail})` : ""}`,
      );
      const buyer = order.buyer as { email?: string; fullName?: string } | null;

      if (buyer?.email) {
        await sendNotice({
          type: "split_payment_update",
          to: [buyer.email],
          subject: `Your split for order #${order.order_number} expired`,
          title: "The split ran out of time",
          paragraphs: [
            `Not everyone paid within 72 hours, so order #${order.order_number} has been cancelled and the items released.`,
            refunds.length
              ? `${refunds.length} ${refunds.length === 1 ? "person has" : "people have"} already paid — our team will refund them.`
              : "Nobody was charged.",
            "You can place the order again any time.",
          ],
          ctaUrl: `${getEmailSiteUrl()}/gifts`,
          ctaLabel: "Shop again",
        });
      }

      await sendNotice({
        type: "split_payment_update",
        toTeam: true,
        subject: refunds.length
          ? `Split expired — ${refunds.length} refund${refunds.length === 1 ? "" : "s"} needed (#${order.order_number})`
          : `Split expired — order #${order.order_number} cancelled`,
        title: "Split payment expired",
        paragraphs: [
          `Order #${order.order_number} (${buyer?.fullName ?? "customer"}) was cancelled after the 72-hour split window. Stock has been restored.`,
          ...(refunds.length
            ? ["Refund these payments manually in Paystack:", ...refundLines]
            : ["No shares were paid — no refunds needed."]),
        ],
        ctaUrl: `${getEmailSiteUrl()}/admin/jobs/gift/${order.id}`,
        ctaLabel: "Open order",
      });

      cancelled += 1;
    } catch (err) {
      errors.push(`${order.id}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  const abandonedCancelled = await cancelAbandonedOrders(db, errors);

  return Response.json({
    ok: true,
    cancelled,
    abandonedCancelled,
    checked: orders?.length ?? 0,
    errors,
  });
}

const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Single-payment orders that never got paid hold stock forever. Release
 * them after 24h, except transfers the customer says they've sent — those
 * wait for an admin to verify.
 */
async function cancelAbandonedOrders(
  db: NonNullable<ReturnType<typeof createAdminClient>>,
  errors: string[],
): Promise<number> {
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_MS).toISOString();
  const { data: stale, error } = await db
    .from("orders")
    .select("id, payment_reference")
    .eq("payment_mode", "single")
    .in("payment_status", ["unpaid", "pending"])
    .neq("status", "cancelled")
    .lt("created_at", cutoff)
    .limit(50);
  if (error) {
    errors.push(`abandoned: ${error.message}`);
    return 0;
  }

  let count = 0;
  for (const row of stale ?? []) {
    if (row.payment_reference === "manual-claim") continue;
    try {
      const done = await adminCancel(
        String(row.id),
        "We didn't receive payment within 24 hours, so we've released the items. You can place the order again any time.",
        { requireUnpaid: true },
      );
      if (done) count += 1;
    } catch (err) {
      errors.push(`${row.id}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }
  return count;
}
