import Link from "next/link";
import { requireVendor } from "@/lib/auth/roles";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { VendorSettingsForm } from "@/components/vendor/VendorSettingsForm";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { PortalActionCard } from "@/components/dashboard/PortalPrimitives";
import { IconOrders, IconTag, IconWallet } from "@/components/ui/Icons";

export default async function VendorSettingsPage() {
  const { vendor } = await requireVendor();

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Profile"
      title="Settings"
      description="Business details and bank information for payouts. Keep these accurate so withdrawals stay smooth."
      actions={<StatusBadge status={vendor.status} />}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <PortalActionCard
          href="/vendor/products"
          title="Catalogue"
          description="Manage listings and stock."
          icon={<IconTag className="h-[18px] w-[18px]" />}
        />
        <PortalActionCard
          href="/vendor/orders"
          title="Orders"
          description="Hub fulfilment pipeline."
          icon={<IconOrders className="h-[18px] w-[18px]" />}
        />
        <PortalActionCard
          href="/vendor/wallet"
          title="Wallet"
          description="Earnings and withdrawals."
          icon={<IconWallet className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="rounded-[24px] border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)] sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-kay-border-light pb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
              Business profile
            </p>
            <p className="mt-1 font-serif text-[24px] text-kay-fg">
              {vendor.businessName}
            </p>
          </div>
          <Link
            href="/vendor"
            className="text-[13px] font-medium text-kay-gold hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
        <VendorSettingsForm vendor={vendor} />
      </div>
    </DashboardLayout>
  );
}
