import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders/store";
import { formatNaira } from "@/lib/data/home";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) notFound();

  const handoverUrl =
    order.handoverToken &&
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/handover/${order.handoverToken}`;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 sm:px-10 lg:py-12">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kay-surface text-kay-gold">
          <span className="text-2xl">✓</span>
        </div>
        <p className="mt-6 text-[11px] uppercase tracking-[0.14em] text-kay-gold">
          Order confirmed
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-kay-fg sm:text-[36px]">
          Thank you
        </h1>
        <p className="mt-3 text-[14px] text-kay-muted">
          Order <span className="font-medium text-kay-fg">{order.orderNumber}</span>
        </p>
      </div>

      <div className="mt-10 space-y-6 rounded-lg border border-kay-border-light bg-kay-surface-elevated/60 p-5 sm:p-6">
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
            Items
          </h2>
          <ul className="mt-3 space-y-2">
            {order.items.map((item) => (
              <li
                key={item.productId}
                className="flex justify-between gap-4 text-[13px]"
              >
                <span className="text-kay-fg">
                  {item.name} × {item.quantity}
                </span>
                <span className="shrink-0 text-kay-muted">
                  {formatNaira(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-[16px] font-semibold text-kay-fg">
            {formatNaira(order.subtotal)}
          </p>
        </div>

        {order.handoverToken && order.handoverStatus === "pending" && (
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
          href="/gifts"
          className="inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-8 text-[13px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
