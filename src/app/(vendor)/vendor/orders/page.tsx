import Link from "next/link";
import { requireVendor } from "@/lib/auth/roles";
import { fetchVendorOrderItems } from "@/lib/vendors/repository";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { VendorFulfillmentActions } from "@/components/vendor/VendorFulfillmentActions";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { formatNaira } from "@/lib/data/home";
import { discreetItemLabel } from "@/lib/after-dark/checkout-privacy";
import { IconOrders, IconPackage, IconTruck } from "@/components/ui/Icons";

const STEPS = [
  "awaiting_payment",
  "awaiting_hub_delivery",
  "at_hub",
  "qc_passed",
  "dispatched",
  "completed",
] as const;

function StepRail({ status }: { status: string }) {
  const idx = STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <div className="mt-4 flex items-center gap-1">
      {STEPS.map((step, i) => (
        <span
          key={step}
          title={step.replace(/_/g, " ")}
          className={`h-1.5 flex-1 rounded-full ${
            idx >= i ? "bg-kay-gold" : "bg-kay-border-light"
          }`}
        />
      ))}
    </div>
  );
}

export default async function VendorOrdersPage() {
  const { vendor } = await requireVendor();
  const items = await fetchVendorOrderItems(vendor.id);
  const open = items.filter(
    (i) => !["completed", "cancelled"].includes(i.fulfillmentStatus),
  ).length;

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Fulfilment"
      title="Orders"
      description={`${items.length} assigned · ${open} open. Deliver to the Kay hub within 12 hours of payment.`}
      actions={
        <Link
          href="/vendor/wallet"
          className="inline-flex h-10 items-center rounded-full border border-kay-border px-5 text-[12px] font-medium hover:border-kay-fg"
        >
          View wallet
        </Link>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: <IconOrders className="h-4 w-4" />,
            title: "Paid",
            text: "Wait for payment confirmation before shipping to hub.",
          },
          {
            icon: <IconTruck className="h-4 w-4" />,
            title: "To hub",
            text: "Mark awaiting hub delivery when the parcel leaves.",
          },
          {
            icon: <IconPackage className="h-4 w-4" />,
            title: "QC & earn",
            text: "Earnings release after Kay QC passes.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-4 shadow-[var(--kay-card-shadow)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kay-surface text-kay-gold">
              {card.icon}
            </div>
            <p className="mt-3 text-[13px] font-medium text-kay-fg">{card.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-kay-muted">
              {card.text}
            </p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <DashboardEmptyState
          icon={<IconOrders className="h-6 w-6" />}
          title="No orders assigned"
          description="When customers buy your products, fulfilment cards appear here with clear next steps."
          actionHref="/vendor/products"
          actionLabel="Manage products"
        />
      ) : (
        <ul className="space-y-4">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="rounded-[24px] border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)] sm:p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={item.fulfillmentStatus} />
                    {item.paymentStatus && (
                      <StatusBadge
                        status={item.paymentStatus}
                        label={`Payment ${item.paymentStatus}`}
                      />
                    )}
                  </div>
                  <StepRail status={item.fulfillmentStatus} />
                </div>
                <div className="w-full lg:max-w-xs">
                  <VendorFulfillmentActions item={item} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
