import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders/store";
import { GiftRevealComposer } from "@/components/reveal/GiftRevealComposer";

type Props = { params: Promise<{ id: string }> };

export default async function OrderRevealPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order || order.deliveryType !== "gift") notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Link
        href={`/order/${order.id}`}
        className="text-[13px] text-kay-muted hover:text-kay-fg"
      >
        ← Back to order {order.orderNumber}
      </Link>
      <div className="mt-6">
        <GiftRevealComposer
          orderId={order.id}
          buyerEmail={order.buyer.email}
          initialNote={order.gift?.note ?? ""}
        />
      </div>
    </div>
  );
}
