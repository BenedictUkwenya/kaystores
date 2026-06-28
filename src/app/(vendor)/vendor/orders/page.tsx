import Link from "next/link";
import { requireVendor } from "@/lib/auth/roles";
import { fetchVendorOrderItems } from "@/lib/vendors/repository";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { VendorFulfillmentActions } from "@/components/vendor/VendorFulfillmentActions";
import { formatNaira } from "@/lib/data/home";
import { discreetItemLabel } from "@/lib/after-dark/checkout-privacy";

export default async function VendorOrdersPage() {
  const { vendor } = await requireVendor();
  const items = await fetchVendorOrderItems(vendor.id);

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Fulfilment"
      title="Orders"
      description="12-hour hub delivery SLA. Update status when items reach the Kay hub."
    >
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-kay-fg">
                  {discreetItemLabel(
                    { name: item.productName, segment: item.segment },
                    index,
                  )}
                </p>
                <p className="mt-1 text-[12px] text-kay-muted">
                  Ref {item.orderNumber} · Qty {item.quantity} ·{" "}
                  {formatNaira(item.lineTotal)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={item.fulfillmentStatus} />
                  {item.paymentStatus && (
                    <StatusBadge status={item.paymentStatus} label={`Payment ${item.paymentStatus}`} />
                  )}
                </div>
              </div>
              <div className="w-full sm:max-w-xs">
                <VendorFulfillmentActions item={item} />
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated px-6 py-14 text-center text-[14px] text-kay-muted">
            No orders assigned yet.
          </li>
        )}
      </ul>
      <p className="mt-6 text-[12px] text-kay-subtle">
        <Link href="/vendor/wallet" className="text-kay-gold hover:underline">
          View wallet
        </Link>{" "}
        for earnings after QC passes.
      </p>
    </DashboardLayout>
  );
}
