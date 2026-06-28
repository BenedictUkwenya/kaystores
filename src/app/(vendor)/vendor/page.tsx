import Link from "next/link";
import { requireVendor } from "@/lib/auth/roles";
import { formatNaira } from "@/lib/data/home";
import {
  fetchVendorOrderItems,
  fetchVendorProducts,
  getVendorWalletSummary,
} from "@/lib/vendors/repository";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { DashboardStatRow } from "@/components/dashboard/DashboardStatRow";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { discreetItemLabel } from "@/lib/after-dark/checkout-privacy";

export default async function VendorOverviewPage() {
  const { vendor } = await requireVendor();
  const [products, orderItems, wallet] = await Promise.all([
    fetchVendorProducts(vendor.id),
    fetchVendorOrderItems(vendor.id),
    getVendorWalletSummary(vendor.id),
  ]);

  const liveCount = products.filter((p) => p.status === "live").length;
  const openOrders = orderItems.filter(
    (o) => !["completed", "cancelled"].includes(o.fulfillmentStatus),
  ).length;

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow={vendor.businessName}
      title="Vendor dashboard"
      description="Manage your catalogue, fulfil hub deliveries, and track earnings."
    >
      <DashboardStatRow
        stats={[
          { label: "Live products", value: String(liveCount), accent: true },
          { label: "Open orders", value: String(openOrders) },
          { label: "Available", value: formatNaira(wallet.available) },
          { label: "Pending", value: formatNaira(wallet.pending) },
        ]}
      />

      <section className="mt-8 rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
        <div className="flex flex-col gap-3 border-b border-kay-border-light px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="font-serif text-[22px] text-kay-fg">Recent orders</h2>
          <Link href="/vendor/orders" className="text-[13px] text-kay-muted hover:text-kay-gold">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-kay-border-light">
          {orderItems.slice(0, 5).map((item, index) => (
            <li key={item.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-kay-fg">
                  {discreetItemLabel(
                    { name: item.productName, segment: item.segment },
                    index,
                  )}
                </p>
                <p className="text-[12px] text-kay-muted">
                  {item.orderNumber ?? item.orderId.slice(0, 8)} · Qty {item.quantity}
                </p>
              </div>
              <StatusBadge status={item.fulfillmentStatus} />
              <p className="font-serif text-[18px] text-kay-fg">
                {formatNaira(item.lineTotal)}
              </p>
            </li>
          ))}
          {orderItems.length === 0 && (
            <li className="px-6 py-10 text-center text-[14px] text-kay-muted">
              No orders yet — list products to start receiving orders.
            </li>
          )}
        </ul>
      </section>
    </DashboardLayout>
  );
}
