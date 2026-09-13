import Link from "next/link";
import { notFound } from "next/navigation";
import { requireVendor } from "@/lib/auth/roles";
import { fetchOrderById } from "@/lib/orders/repository";
import { vendorHasOrder } from "@/lib/orders/support";
import { fetchVendorOrderItems } from "@/lib/vendors/repository";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { VendorFulfillmentActions } from "@/components/vendor/VendorFulfillmentActions";
import { OrderSupportChat } from "@/components/orders/OrderSupportChat";
import { formatNaira } from "@/lib/data/home";

type Props = { params: Promise<{ id: string }> };

export default async function VendorOrderDetailPage({ params }: Props) {
  const { vendor } = await requireVendor();
  const { id } = await params;
  if (!(await vendorHasOrder(vendor.id, id))) notFound();

  const [order, items] = await Promise.all([
    fetchOrderById(id),
    fetchVendorOrderItems(vendor.id),
  ]);
  if (!order) notFound();
  const mine = items.filter((item) => item.orderId === id);

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Fulfilment"
      title={order.orderNumber}
      description="Deliver this item to the Kay hub. Use support if you need Kay to confirm a product detail."
    >
      <div className="mb-4">
        <Link
          href="/vendor/orders"
          className="text-[13px] text-kay-muted underline-offset-2 hover:text-kay-fg hover:underline"
        >
          ← All orders
        </Link>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-gold">
            Your items
          </p>
          <ul className="space-y-4">
            {mine.map((item) => (
              <li key={item.id} className="border-b border-kay-border-light pb-4 last:border-0 last:pb-0">
                <p className="font-medium text-kay-fg">{item.productName}</p>
                <p className="mt-1 text-[12px] text-kay-muted">
                  Qty {item.quantity} · {formatNaira(item.lineTotal)}
                </p>
                <div className="mt-2">
                  <StatusBadge status={item.fulfillmentStatus} />
                </div>
                <div className="mt-3">
                  <VendorFulfillmentActions item={item} />
                </div>
              </li>
            ))}
          </ul>
          <p className="rounded-lg bg-kay-surface px-3 py-2 text-[12px] text-kay-muted">
            Send goods to the Kay hub after payment — not directly to the
            customer. Kay handles last-mile from the hub.
          </p>
        </div>
        <OrderSupportChat orderId={id} viewerRole="vendor" />
      </div>
    </DashboardLayout>
  );
}
