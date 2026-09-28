import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrder } from "@/lib/orders/store";
import { listSharesForOrder } from "@/lib/payments/shares";
import { absoluteUrl } from "@/lib/site";
import { SplitSharesPanel } from "@/components/payments/SplitSharesPanel";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderSplitPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  if (order.paymentMode !== "split") redirect(`/order/${order.id}`);

  const shares = await listSharesForOrder(order.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-10 lg:py-12">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.14em] text-kay-gold">
          Split the cost
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-kay-fg sm:text-[36px]">
          Share the links
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-kay-muted">
          Order <span className="font-medium text-kay-fg">{order.orderNumber}</span>{" "}
          is held for you. Send one link to each person — including one for
          yourself. We confirm the order the moment every share is paid.
        </p>
      </div>

      <SplitSharesPanel
        orderId={order.id}
        grandTotal={order.pricing.grandTotal}
        orderPaid={order.paymentStatus === "paid"}
        orderCancelled={order.status === "cancelled"}
        expiresAt={order.splitExpiresAt ?? null}
        organiserName={order.buyer.fullName.split(/\s+/)[0] ?? "A friend"}
        shares={shares.map((s) => ({
          id: s.id,
          index: s.shareIndex,
          amount: s.amount,
          status: s.status,
          payerName: s.payerName,
          url: absoluteUrl(`/split/${s.token}`),
        }))}
      />

      <div className="mt-8 flex justify-center">
        <Link
          href={`/order/${order.id}`}
          className="inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-8 text-[13px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
        >
          View order details
        </Link>
      </div>
    </div>
  );
}
