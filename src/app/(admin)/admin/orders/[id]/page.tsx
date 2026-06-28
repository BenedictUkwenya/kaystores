import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchOrderById } from "@/lib/orders/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";
import { AdminQcPassButton } from "@/components/admin/AdminQcPassButton";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatNaira } from "@/lib/data/home";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = await fetchOrderById(id);
  if (!order) notFound();

  const admin = createAdminClient();
  const { data: vendorItems } = await admin
    ?.from("vendor_order_items")
    .select("*")
    .eq("order_id", id) ?? { data: [] };

  const { data: orderMeta } = admin
    ? await admin
        .from("orders")
        .select("payment_status, tracking_number, tracking_carrier")
        .eq("id", id)
        .maybeSingle()
    : { data: null };

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Order detail"
      title={order.orderNumber}
      badge="Admin"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            {orderMeta?.payment_status && (
              <StatusBadge status={String(orderMeta.payment_status)} label={`Payment ${orderMeta.payment_status}`} />
            )}
          </div>
          <p className="mt-4 text-[13px] text-kay-muted">
            {order.buyer.fullName} · {order.buyer.email} · {order.buyer.phone}
          </p>
          <ul className="mt-6 space-y-2 border-t border-kay-border-light pt-4">
            {order.items.map((item) => (
              <li key={item.productId} className="flex justify-between text-[13px]">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatNaira(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-serif text-[22px] text-kay-fg">
            {formatNaira(order.pricing.grandTotal)}
          </p>

          {(vendorItems ?? []).length > 0 && (
            <div className="mt-6 border-t border-kay-border-light pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
                Vendor fulfilment
              </p>
              <ul className="mt-3 space-y-3">
                {(vendorItems ?? []).map((vi) => (
                  <li key={vi.id} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between text-[13px]">
                    <span className="min-w-0">{vi.product_name}</span>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <StatusBadge status={vi.fulfillment_status} />
                      {vi.fulfillment_status === "at_hub" && (
                        <AdminQcPassButton orderId={id} itemId={String(vi.id)} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <AdminOrderActions
          orderId={id}
          paymentStatus={orderMeta?.payment_status as string | undefined}
          trackingNumber={orderMeta?.tracking_number as string | undefined}
          trackingCarrier={orderMeta?.tracking_carrier as string | undefined}
        />
      </div>
    </DashboardLayout>
  );
}
