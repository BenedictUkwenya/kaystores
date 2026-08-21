import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders/store";
import { formatNaira } from "@/lib/data/home";
import { absoluteUrl } from "@/lib/site";
import { PRICING_CONFIG } from "@/lib/pricing/config";
import { OrderTrackingTimeline } from "@/components/orders/OrderTrackingTimeline";
import { GiftRecipientNotice } from "@/components/orders/GiftRecipientNotice";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import {
  DISCREET_CONFIRMATION_EYEBROW,
  DISCREET_SEGMENT_LABEL,
  discreetItemLabel,
  isDiscreetOrder,
} from "@/lib/after-dark/checkout-privacy";
import { OrderPaymentSection } from "@/components/payments/OrderPaymentSection";
import { PaymentReturnVerifier } from "@/components/payments/PaystackPayButton";
import { buildTxRef, isPaystackConfigured } from "@/lib/payments/config";
import { IconLock } from "@/components/ui/Icons";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    payment?: string;
    reference?: string;
    trxref?: string;
    tx_ref?: string;
    status?: string;
  }>;
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const order = await getOrder(id);
  if (!order) notFound();

  const paid = order.paymentStatus === "paid";
  const paystackEnabled = isPaystackConfigured();
  const reference =
    query.reference ??
    query.trxref ??
    query.tx_ref ??
    (query.payment === "return" ? buildTxRef("order", id) : null);

  const pricing = order.pricing;
  const discreet = isDiscreetOrder(order.items);
  const handoverUrl =
    order.handoverToken && absoluteUrl(`/handover/${order.handoverToken}`);

  return (
    <div
      className={`mx-auto max-w-2xl px-4 py-8 sm:px-10 lg:py-12 ${
        discreet ? "after-dark-private-checkout rounded-xl" : ""
      }`}
    >
      <div className="text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            discreet
              ? "border border-ad-amber/30 bg-ad-amber/10 text-ad-amber"
              : "bg-kay-surface text-kay-gold"
          }`}
        >
          {discreet ? (
            <IconLock className="h-6 w-6" />
          ) : (
            <span className="text-2xl">✓</span>
          )}
        </div>
        <p
          className={`mt-6 text-[11px] uppercase tracking-[0.14em] ${
            discreet ? "text-ad-amber/90" : "text-kay-gold"
          }`}
        >
          {discreet ? DISCREET_CONFIRMATION_EYEBROW : paid ? "Order confirmed" : "Complete payment"}
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-kay-fg sm:text-[36px]">
          {discreet
            ? paid
              ? "Your private order is secured"
              : "Complete your private order"
            : paid
              ? "Thank you"
              : "Almost there"}
        </h1>
        <p className="mt-3 text-[14px] text-kay-muted">
          {discreet ? "Private reference" : "Order"}{" "}
          <span className="font-medium text-kay-fg">{order.orderNumber}</span>
          <span className="mx-2 text-kay-border">·</span>
          {ORDER_STATUS_LABELS[order.status]}
        </p>
        {discreet && (
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-kay-muted">
            Item titles are hidden on this page and in your confirmation email.
            Packaging is plain and unmarked.
          </p>
        )}
      </div>

      <div className="mt-8">
        <OrderTrackingTimeline order={order} />
      </div>

      {reference && !paid && <PaymentReturnVerifier reference={reference} />}
      <OrderPaymentSection order={order} paystackEnabled={paystackEnabled} />

      <div className="mt-6 space-y-6 rounded-lg border border-kay-border-light bg-kay-surface-elevated/60 p-5 sm:p-6">
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
            Delivery
          </h2>
          <p className="mt-1 text-[15px] text-kay-fg">
            {order.deliveryType === "gift"
              ? "Sending as a Gift"
              : "Delivering to Myself"}
          </p>
          {order.deliveryType === "gift" && order.gift && (
            <p className="mt-1 text-[13px] text-kay-muted">
              For {order.gift.recipientName}
              {order.gift.anonymous && " · Sent anonymously"}
            </p>
          )}
        </div>

        <div className="border-t border-kay-border-light pt-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
            {discreet ? "Private selections" : "Items"}
          </h2>
          <ul className="mt-3 space-y-2">
            {order.items.map((item, index) => (
              <li
                key={item.productId}
                className="flex justify-between gap-4 text-[13px]"
              >
                <span className="text-kay-fg">
                  {discreetItemLabel(item, index)} × {item.quantity}
                </span>
                <span className="shrink-0 text-kay-muted">
                  {formatNaira(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-kay-border-light pt-6 text-[13px]">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
            Payment summary
          </h2>
          <dl className="mt-3 space-y-2">
            {pricing.segments.map((seg) => (
              <div key={seg.segment}>
                {pricing.segments.length > 1 && (
                  <dt className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-kay-gold">
                    {seg.segment === "after_dark" && discreet
                      ? DISCREET_SEGMENT_LABEL
                      : PRICING_CONFIG[seg.segment].label}
                  </dt>
                )}
                <div className="flex justify-between text-kay-muted">
                  <dt>Products</dt>
                  <dd>{formatNaira(seg.productSubtotal)}</dd>
                </div>
                <div className="flex justify-between text-kay-muted">
                  <dt>Curation ({Math.round(seg.curationRate * 100)}%)</dt>
                  <dd>{formatNaira(seg.curationFee)}</dd>
                </div>
              </div>
            ))}
            <div className="flex justify-between text-kay-muted">
              <dt>Delivery</dt>
              <dd>
                {pricing.deliveryFee === 0
                  ? "Complimentary"
                  : formatNaira(pricing.deliveryFee)}
              </dd>
            </div>
            <div className="flex justify-between text-kay-muted">
              <dt>Tax</dt>
              <dd>{formatNaira(pricing.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-kay-border-light pt-3 text-[16px] font-semibold text-kay-fg">
              <dt>{paid ? "Total paid" : "Total due"}</dt>
              <dd>{formatNaira(pricing.grandTotal)}</dd>
            </div>
          </dl>
        </div>

        {order.deliveryType === "gift" &&
          order.gift?.recipientEmail && (
            <GiftRecipientNotice
              orderId={order.id}
              buyerEmail={order.buyer.email}
              recipientName={order.gift.recipientName}
              recipientEmail={order.gift.recipientEmail}
              handoverUrl={
                order.handoverToken && order.handoverStatus === "pending"
                  ? handoverUrl ?? undefined
                  : undefined
              }
            />
          )}

        {order.deliveryType === "gift" && (
          <div className="rounded-lg border border-kay-gold/30 bg-kay-beta-bg/50 px-4 py-4">
            <h2 className="text-[13px] font-medium text-kay-fg">Kay Reveal</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-kay-muted">
              Add or edit the video, photo, and note behind the QR code on the
              gift box — before we ship.
            </p>
            <Link
              href={`/order/${order.id}/reveal`}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-kay-fg px-4 text-[12px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
            >
              Manage Kay Reveal
            </Link>
          </div>
        )}

        {order.handoverToken &&
          order.handoverStatus === "pending" &&
          order.deliveryType !== "gift" && (
          <div className="rounded-lg border border-kay-gold/30 bg-kay-beta-bg/50 px-4 py-4">
            <h2 className="text-[13px] font-medium text-kay-fg">
              Digital Handover link
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-kay-muted">
              Share this secure link with your recipient so they can provide
              their delivery address.
            </p>
            <p className="mt-3 break-all rounded-md bg-kay-bg px-3 py-2 font-mono text-[11px] text-kay-fg">
              {handoverUrl || `/handover/${order.handoverToken}`}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/account"
          className="inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-8 text-[13px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
        >
          View account
        </Link>
        <Link
          href={discreet ? "/after-dark" : "/gifts"}
          className="inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-8 text-[13px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
        >
          {discreet ? "Return to private catalogue" : "Continue Shopping"}
        </Link>
      </div>
    </div>
  );
}
