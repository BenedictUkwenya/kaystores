import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchOrderById } from "@/lib/orders/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminOrderWorkspace } from "@/components/admin/AdminOrderWorkspace";
import { AdminItemHubActions } from "@/components/admin/AdminItemHubActions";
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
      .select(
        "*, vendors(business_name, contact_name, contact_phone, contact_email, pickup_address)",
      )
      .eq("order_id", id)) ?? { data: [] };

  const { data: orderMeta } = admin
    ? await admin
        .from("orders")
        .select(
          "payment_status, payment_reference, paid_at, tracking_number, tracking_carrier, tracking_url",
        )
        .eq("id", id)
        .maybeSingle()
    : { data: null };
  const orderPaid = orderMeta?.payment_status === "paid";
  const fmtTime = (value: unknown) =>
    value
      ? new Date(String(value)).toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;

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
          Buyer: {order.buyer.fullName} ·{" "}
          <a href={`mailto:${order.buyer.email}`} className="underline underline-offset-2">
            {order.buyer.email}
          </a>{" "}
          ·{" "}
          <a href={`tel:${order.buyer.phone}`} className="underline underline-offset-2">
            {order.buyer.phone}
          </a>
        </p>
        {(orderMeta?.payment_reference || orderMeta?.paid_at) && (
          <p className="mt-1 text-[12px] text-kay-subtle">
            {orderMeta?.payment_reference === "manual-claim"
              ? "Customer says they paid by transfer — verify before marking paid"
              : orderMeta?.payment_reference
                ? `Payment ref: ${String(orderMeta.payment_reference)}`
                : null}
            {orderMeta?.paid_at ? ` · Paid ${fmtTime(orderMeta.paid_at)}` : ""}
          </p>
        )}
        {orderMeta?.tracking_number && (
          <p className="mt-1 text-[12px] text-kay-subtle">
            Tracking: {String(orderMeta.tracking_carrier ?? "")} {String(orderMeta.tracking_number)}
            {orderMeta.tracking_url && (
              <>
                {" · "}
                <a
                  href={String(orderMeta.tracking_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  Track
                </a>
              </>
            )}
          </p>
        )}
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
              {(vendorItems ?? []).map((vi) => {
                const vendor = vi.vendors as {
                  business_name?: string;
                  contact_name?: string;
                  contact_phone?: string;
                  contact_email?: string;
                  pickup_address?: { line1?: string; city?: string; state?: string } | null;
                } | null;
                const pickup = vendor?.pickup_address
                  ? [vendor.pickup_address.line1, vendor.pickup_address.city, vendor.pickup_address.state]
                      .filter(Boolean)
                      .join(", ")
                  : "";
                return (
                <li
                  key={vi.id}
                  className="flex flex-col gap-2 rounded-xl border border-kay-border-light p-3 text-[13px] sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="block font-medium">
                      {vi.product_name} × {vi.quantity}
                    </span>
                    {vendor && (
                      <span className="block text-[11px] text-kay-muted">
                        {vendor.business_name}
                        {vendor.contact_name ? ` · ${vendor.contact_name}` : ""}
                        {vendor.contact_phone && (
                          <>
                            {" · "}
                            <a href={`tel:${vendor.contact_phone}`} className="underline underline-offset-2">
                              {vendor.contact_phone}
                            </a>
                          </>
                        )}
                        {vendor.contact_email && (
                          <>
                            {" · "}
                            <a href={`mailto:${vendor.contact_email}`} className="underline underline-offset-2">
                              {vendor.contact_email}
                            </a>
                          </>
                        )}
                      </span>
                    )}
                    {pickup && (
                      <span className="block text-[11px] text-kay-muted">Vendor location: {pickup}</span>
                    )}
                    {vi.selected_hub_name ? (
                      <span className="block text-[11px] text-kay-muted">
                        Hub: {String(vi.selected_hub_name)}
                        {vi.selected_hub_phone
                          ? ` · ${String(vi.selected_hub_phone)}`
                          : ""}
                        {vi.vendor_dispatched_at
                          ? ` · sent ${fmtTime(vi.vendor_dispatched_at)}`
                          : " · not sent yet"}
                      </span>
                    ) : (
                      orderPaid &&
                      vi.fulfillment_status === "awaiting_hub_delivery" && (
                        <span className="block text-[11px] text-amber-700">
                          Vendor hasn&apos;t picked a hub yet
                        </span>
                      )
                    )}
                    {vi.hub_notes && (
                      <span className="block text-[11px] text-kay-fg">
                        Vendor note: {String(vi.hub_notes)}
                      </span>
                    )}
                    {vi.hub_reminder_sent_at &&
                      vi.fulfillment_status === "awaiting_hub_delivery" && (
                        <span className="mt-0.5 block text-[11px] text-amber-700">
                          12h reminder sent — still awaiting dispatch
                        </span>
                      )}
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <StatusBadge status={vi.fulfillment_status} />
                    <AdminItemHubActions
                      orderId={id}
                      itemId={String(vi.id)}
                      status={String(vi.fulfillment_status)}
                      orderPaid={orderPaid}
                    />
                  </div>
                </li>
                );
              })}
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
        paymentReference={orderMeta?.payment_reference as string | undefined}
        orderStatus={order.status}
        allItemsQcPassed={(vendorItems ?? [])
          .filter((vi) => vi.fulfillment_status !== "cancelled")
          .every((vi) => ["qc_passed", "dispatched", "completed"].includes(String(vi.fulfillment_status)))}
        trackingNumber={orderMeta?.tracking_number as string | undefined}
        trackingCarrier={orderMeta?.tracking_carrier as string | undefined}
        trackingUrl={orderMeta?.tracking_url as string | undefined}
        isGift={order.deliveryType === "gift"}
        vendorThreads={[
          ...new Map(
            (vendorItems ?? [])
              .filter((vi) => vi.vendor_id)
              .map((vi) => [
                String(vi.vendor_id),
                {
                  id: String(vi.vendor_id),
                  name:
                    (vi.vendors as { business_name?: string } | null)?.business_name ?? "Vendor",
                },
              ]),
          ).values(),
        ]}
        details={details}
      />
    </DashboardLayout>
  );
}
