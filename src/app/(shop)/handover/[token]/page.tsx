import { notFound } from "next/navigation";
import { getOrderByHandoverToken } from "@/lib/orders/store";
import { HandoverForm } from "@/components/checkout/HandoverForm";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function HandoverPage({ params }: PageProps) {
  const { token } = await params;
  const order = await getOrderByHandoverToken(token);
  if (!order || order.deliveryType !== "gift") notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-10 lg:py-12">
      <HandoverForm token={token} order={order} />
    </div>
  );
}
