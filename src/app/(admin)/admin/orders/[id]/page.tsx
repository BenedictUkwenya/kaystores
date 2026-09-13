import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchOrderById } from "@/lib/orders/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminOrderWorkspace } from "@/components/admin/AdminOrderWorkspace";
import { AdminQcPassButton } from "@/components/admin/AdminQcPassButton";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatNaira } from "@/lib/data/home";
import {
  formatAddressLines,
  getDeliveryAddress,
  mapsUrl,
} from "@/lib/orders/address";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = await fetchOrderById(id);
  if (!order) notFound();

  const admin = createAdminClient();
  const { data: vendorItems } =
    (await admin
      ?.from("vendor_order_items")
      .select("*")
      .eq("order_id", id)) ?? { data: [] };

  const { data: orderMeta } = admin
    ? await admin
        .from("orders")
        .select("payment_status, tracking_number, tracking_carrier")
        .eq("id", id)
        .maybeSingle()
    : { data: null };

  const { data: quote } = admin
    ? await admin
        .from("shipping_quotes")
        .select(
          "carrier_name, service_name, amount, delivery_eta, destination",
        )
        .eq("order_id", id)
        .maybeSingle()
    : { data: null };

  const address = getDeliveryAddress(order);
  const addressLines = formatAddressLines(address);
  const mapHref = mapsUrl(address);
  const shipToName =
    order.deliveryType === "gift"
      ? order.gift?.recipientName || "Gift recipient"
      : order.buyer.fullName;

  const details = (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-kay-gold/40 bg-kay-gold-light/20 p-5 shadow-[var(--kay-card-shadow)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
          Ship to
        </p>
        <p className="mt-2 text-[18px] font-semibold text-kay-fg">{shipToName}</p>
        <p className="mt-1 text-[13px] text-kay-muted">
          {order.deliveryType === "gift" ? "Gift delivery" : "Buyer address"}
          {order.anonymousPackaging ? " · Anonymous packaging" : ""}
        </p>
        {addressLines.length > 0 ? (
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-kay-fg">
            {addressLines.join("\n")}
          </p>
        ) : (
          <p className="mt-3 text-[14px] text-red-600">
            No delivery address on this order.
          </p>
        )}
        {order.deliveryType === "gift" && order.gift && (
          <p className="mt-3 text-[13px] text-kay-muted">
            Recipient: {order.gift.recipientName}
            {order.gift.recipientEmail ? ` · ${order.gift.recipientEmail}` : ""}
            {order.gift.recipientPhone || order.gift.recipientWhatsApp
              ? ` · ${order.gift.recipientPhone || order.gift.recipientWhatsApp}`
              : ""}
            {order.gift.anonymous ? " · Sender name hidden" : ""}
          </p>
        )}
        {mapHref && (
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-[13px] font-medium text-kay-fg underline underline-offset-2"
          >
            Open in Maps
          </a>
        )}
      </div>

      <div className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)]">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.status} />
          {orderMeta?.payment_status && (
            <StatusBadge
              status={String(orderMeta.payment_status)}
              label={`Payment ${orderMeta.payment_status}`}
            />
          )}
        </div>
        <p className="mt-3 text-[13px] text-kay-muted">
          Buyer: {order.buyer.fullName} · {order.buyer.email} · {order.buyer.phone}
        </p>
        {quote && (
          <p className="mt-2 text-[13px] text-kay-muted">
            Delivery: {quote.carrier_name}
            {quote.service_name ? ` · ${quote.service_name}` : ""}
            {quote.delivery_eta ? ` · ${quote.delivery_eta}` : ""}
            {quote.amount != null ? ` · ₦${Number(quote.amount).toLocaleString("en-NG")}` : ""}
          </p>
        )}
        {order.gift?.note && (
          <p className="mt-3 rounded-lg bg-kay-surface px-3 py-2 text-[13px] text-kay-fg">
            Gift note: {order.gift.note}
          </p>
        )}

        <ul className="mt-5 space-y-2 border-t border-kay-border-light pt-4">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-3 text-[13px]">
              <span>
                {item.name} × {item.quantity}
                {item.variationOptionLabel
                  ? ` · ${item.variationLabel ?? ""} ${item.variationOptionLabel}`
                  : ""}
              </span>
              <span className="shrink-0">{formatNaira(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-serif text-[22px] text-kay-fg">
          {formatNaira(order.pricing.grandTotal)}
        </p>

        {(vendorItems ?? []).length > 0 && (
          <div className="mt-5 border-t border-kay-border-light pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
              Vendor fulfilment
            </p>
            <ul className="mt-3 space-y-3">
              {(vendorItems ?? []).map((vi) => (
                <li
                  key={vi.id}
                  className="flex flex-col gap-2 text-[13px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
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
    </div>
  );

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Order detail"
      title={order.orderNumber}
      description={`${shipToName} · ${order.deliveryType === "gift" ? "Gift" : "Self"} delivery`}
      badge="Admin"
    >
      <AdminOrderWorkspace
        orderId={id}
        paymentStatus={orderMeta?.payment_status as string | undefined}
        trackingNumber={orderMeta?.tracking_number as string | undefined}
        trackingCarrier={orderMeta?.tracking_carrier as string | undefined}
        isGift={order.deliveryType === "gift"}
        details={details}
      />
    </DashboardLayout>
  );
}
