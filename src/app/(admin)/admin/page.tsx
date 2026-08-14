import Link from "next/link";
import { fetchAdminOverview } from "@/lib/admin/repository";
import { requireAdmin } from "@/lib/auth/roles";
import { formatNaira } from "@/lib/data/home";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { DashboardStatRow } from "@/components/dashboard/DashboardStatRow";
import {
  PortalActionCard,
  PortalQueueItem,
  PortalSection,
} from "@/components/dashboard/PortalPrimitives";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import {
  IconChart,
  IconConcierge,
  IconImport,
  IconOrders,
  IconPackage,
  IconStore,
  IconTag,
  IconUsers,
  IconWallet,
} from "@/components/ui/Icons";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const stats = await fetchAdminOverview();

  const queue = [
    {
      href: "/admin/vendors/applications",
      title: "Vendor applications",
      meta: `${stats.pendingVendorApplications} awaiting review`,
      count: stats.pendingVendorApplications,
      icon: <IconStore className="h-[18px] w-[18px]" />,
    },
    {
      href: "/admin/concierge",
      title: "Concierge requests",
      meta: `${stats.pendingConcierge} open client requests`,
      count: stats.pendingConcierge,
      icon: <IconConcierge className="h-[18px] w-[18px]" />,
    },
    {
      href: "/admin/payouts",
      title: "Pending payouts",
      meta: `${stats.pendingWithdrawals} withdrawal requests`,
      count: stats.pendingWithdrawals,
      icon: <IconWallet className="h-[18px] w-[18px]" />,
    },
    {
      href: "/admin/orders",
      title: "Orders today",
      meta: `${stats.ordersToday} placed · ${formatNaira(stats.gmvToday)} GMV`,
      count: stats.ordersToday,
      icon: <IconOrders className="h-[18px] w-[18px]" />,
    },
  ].filter((item) => item.count > 0);

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Platform control"
      title="Overview"
      description="A calm command centre for orders, partners, catalogue health, and payouts."
      badge="Admin"
      actions={
        <>
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center rounded-full bg-kay-accent px-5 text-[12px] font-medium text-kay-accent-fg"
          >
            Add product
          </Link>
          <Link
            href="/admin/vendors/invites"
            className="inline-flex h-10 items-center rounded-full border border-kay-border px-5 text-[12px] font-medium text-kay-fg hover:border-kay-fg"
          >
            Invite vendor
          </Link>
        </>
      }
    >
      <DashboardStatRow
        stats={[
          {
            label: "Orders today",
            value: String(stats.ordersToday),
            hint: `${formatNaira(stats.gmvToday)} GMV`,
            accent: true,
            icon: <IconOrders className="h-[18px] w-[18px]" />,
            href: "/admin/orders",
          },
          {
            label: "Members",
            value: String(stats.totalUsers),
            hint: `${stats.totalVendors} vendors on platform`,
            icon: <IconUsers className="h-[18px] w-[18px]" />,
            href: "/admin/users",
          },
          {
            label: "Live products",
            value: String(stats.liveProducts),
            hint: "Vendor + Kay catalogue",
            icon: <IconTag className="h-[18px] w-[18px]" />,
            href: "/admin/products",
          },
          {
            label: "Pending payouts",
            value: String(stats.pendingWithdrawals),
            hint: "Awaiting finance review",
            icon: <IconWallet className="h-[18px] w-[18px]" />,
            href: "/admin/payouts",
          },
        ]}
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PortalSection
          title="Needs attention"
          description="Prioritised work queue — clear these first to keep Kay running smoothly."
        >
          {queue.length > 0 ? (
            <div>
              {queue.map((item) => (
                <PortalQueueItem
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  meta={item.meta}
                  icon={item.icon}
                  badge={
                    <span className="rounded-full bg-kay-gold-light/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-kay-gold">
                      {item.count}
                    </span>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="p-6">
              <DashboardEmptyState
                icon={<IconChart className="h-6 w-6" />}
                title="All clear"
                description="No pending applications, payouts, or open concierge requests right now."
                actionHref="/admin/orders"
                actionLabel="Review orders"
              />
            </div>
          )}
        </PortalSection>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-subtle">
            Quick actions
          </p>
          <PortalActionCard
            href="/admin/products/new?owner=kay"
            title="Add Kay product"
            description="List Kay-owned inventory without a vendor payout."
            icon={<IconPackage className="h-[18px] w-[18px]" />}
            tone="gold"
          />
          <PortalActionCard
            href="/admin/products/import"
            title="Import catalogue"
            description="CSV + SKU images for a vendor batch."
            icon={<IconImport className="h-[18px] w-[18px]" />}
          />
          <PortalActionCard
            href="/admin/vendors/applications"
            title="Review partners"
            description={`${stats.pendingVendorApplications} self-apply applications waiting.`}
            icon={<IconStore className="h-[18px] w-[18px]" />}
          />
          <PortalActionCard
            href="/api/admin/export/orders"
            title="Export orders CSV"
            description="Download the current order ledger."
            icon={<IconImport className="h-[18px] w-[18px]" />}
            tone="ink"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
