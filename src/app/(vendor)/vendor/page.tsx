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
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import {
  PortalActionCard,
  PortalSection,
} from "@/components/dashboard/PortalPrimitives";
import { discreetItemLabel } from "@/lib/after-dark/checkout-privacy";
import { hasAnyPlacement } from "@/lib/shop/taxonomy";
import {
  IconOrders,
  IconPackage,
  IconPlus,
  IconTag,
  IconWallet,
} from "@/components/ui/Icons";

export default async function VendorOverviewPage() {
  const { vendor } = await requireVendor();
  const [products, orderItems, wallet] = await Promise.all([
    fetchVendorProducts(vendor.id),
    fetchVendorOrderItems(vendor.id),
    getVendorWalletSummary(vendor.id),
  ]);

  const liveCount = products.filter((p) => p.status === "live").length;
  const draftCount = products.filter((p) => p.status === "draft").length;
  const needsPlacement = products.filter(
    (p) => p.status === "live" && !hasAnyPlacement(p),
  ).length;
  const openOrders = orderItems.filter(
    (o) => !["completed", "cancelled"].includes(o.fulfillmentStatus),
  ).length;
  const awaitingHub = orderItems.filter(
    (o) => o.fulfillmentStatus === "awaiting_hub_delivery",
  ).length;

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow={vendor.businessName}
      title="Vendor dashboard"
      description="Grow your boutique on Kay — catalogue health, hub fulfilment, and earnings in one place."
      actions={
        <Link
          href="/vendor/products/new"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-kay-accent px-5 text-[12px] font-medium text-kay-accent-fg"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Add product
        </Link>
      }
    >
      <DashboardStatRow
        stats={[
          {
            label: "Live products",
            value: String(liveCount),
            hint:
              draftCount > 0
                ? `${draftCount} draft${draftCount === 1 ? "" : "s"} waiting`
                : "Published on the shop",
            accent: true,
            icon: <IconTag className="h-[18px] w-[18px]" />,
            href: "/vendor/products",
          },
          {
            label: "Open orders",
            value: String(openOrders),
            hint:
              awaitingHub > 0
                ? `${awaitingHub} awaiting hub delivery`
                : "Fulfilment pipeline",
            icon: <IconOrders className="h-[18px] w-[18px]" />,
            href: "/vendor/orders",
          },
          {
            label: "Available",
            value: formatNaira(wallet.available),
            hint: "Ready to withdraw",
            icon: <IconWallet className="h-[18px] w-[18px]" />,
            href: "/vendor/wallet",
          },
          {
            label: "Pending",
            value: formatNaira(wallet.pending),
            hint: "Clears after QC",
            icon: <IconPackage className="h-[18px] w-[18px]" />,
            href: "/vendor/wallet",
          },
        ]}
      />

      {needsPlacement > 0 && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-[13px] text-amber-950">
          {needsPlacement} live listing
          {needsPlacement === 1 ? "" : "s"} missing shop categories.{" "}
          <Link href="/vendor/products" className="font-medium underline">
            Fix placement
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <PortalSection
          title="Recent orders"
          description="12-hour hub delivery SLA — update status as items move."
          actionHref="/vendor/orders"
          actionLabel="View all"
        >
          {orderItems.length === 0 ? (
            <div className="p-6">
              <DashboardEmptyState
                icon={<IconOrders className="h-6 w-6" />}
                title="No orders yet"
                description="Publish live products with photos, stock, and categories to start receiving Kay orders."
                actionHref="/vendor/products/new"
                actionLabel="Add your first product"
              />
            </div>
          ) : (
            <ul className="divide-y divide-kay-border-light">
              {orderItems.slice(0, 5).map((item, index) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-kay-fg">
                      {discreetItemLabel(
                        { name: item.productName, segment: item.segment },
                        index,
                      )}
                    </p>
                    <p className="mt-1 text-[12px] text-kay-muted">
                      {item.orderNumber ?? item.orderId.slice(0, 8)} · Qty{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={item.fulfillmentStatus} />
                    <p className="font-serif text-[18px] text-kay-fg">
                      {formatNaira(item.lineTotal)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PortalSection>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-subtle">
            Grow your boutique
          </p>
          <PortalActionCard
            href="/vendor/products/new"
            title="List a new gift"
            description="Photos, price, stock, and shop categories."
            icon={<IconPlus className="h-[18px] w-[18px]" />}
            tone="gold"
          />
          <PortalActionCard
            href="/vendor/orders"
            title="Fulfil hub deliveries"
            description="Mark items when they leave for the Kay hub."
            icon={<IconOrders className="h-[18px] w-[18px]" />}
          />
          <PortalActionCard
            href="/vendor/wallet"
            title="Check earnings"
            description={`${formatNaira(wallet.available)} available to withdraw.`}
            icon={<IconWallet className="h-[18px] w-[18px]" />}
            tone="ink"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
