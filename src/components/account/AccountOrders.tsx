import Link from "next/link";
import type { OrderSummary } from "@/types/order";
import { formatNaira } from "@/lib/data/home";
import { formatOrderDate } from "@/lib/orders/status";
import { OrderStatusBadge } from "@/components/account/account-utils";
import { IconArrowRight, IconBag } from "@/components/ui/Icons";

type Props = {
  orders: OrderSummary[];
};

export function AccountOrders({ orders }: Props) {
  return (
    <section className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-kay-border-light px-6 py-5 sm:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
            Purchases
          </p>
          <h2 className="mt-1 font-serif text-[26px] text-kay-fg">
            Order history
          </h2>
        </div>
        <Link
          href="/track-order"
          className="text-[13px] font-medium text-kay-muted transition-colors hover:text-kay-gold"
        >
          Track by reference
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="px-6 py-14 text-center sm:px-8 sm:py-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-kay-surface text-kay-gold">
            <IconBag className="h-7 w-7" />
          </div>
          <p className="mt-6 font-serif text-[24px] text-kay-fg">
            No orders yet
          </p>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-kay-muted">
            When you checkout while signed in, your purchases appear here with
            live status and delivery updates.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/gifts"
              className="inline-flex h-11 items-center justify-center rounded-full bg-kay-accent px-8 text-[13px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90"
            >
              Explore gifts
            </Link>
            <Link
              href="/track-order"
              className="inline-flex h-11 items-center justify-center rounded-full border border-kay-border px-8 text-[13px] font-medium text-kay-fg transition-colors hover:border-kay-fg"
            >
              Track guest order
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-kay-border-light">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/order/${order.id}`}
                className="group flex flex-wrap items-center gap-4 px-6 py-5 transition-colors hover:bg-kay-surface/60 sm:px-8 sm:py-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-kay-surface text-kay-gold">
                  <IconBag className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-kay-fg transition-colors group-hover:text-kay-gold">
                      {order.orderNumber}
                    </p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-[13px] text-kay-muted">
                    {formatOrderDate(order.createdAt)}
                    <span className="mx-2 text-kay-border">·</span>
                    {order.deliveryType === "gift"
                      ? "Gift delivery"
                      : "Personal delivery"}
                  </p>
                </div>

                <div className="flex items-center gap-4 sm:ml-auto">
                  <p className="font-serif text-[20px] text-kay-fg">
                    {formatNaira(order.pricing.grandTotal)}
                  </p>
                  <IconArrowRight className="h-4 w-4 text-kay-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-kay-gold" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
