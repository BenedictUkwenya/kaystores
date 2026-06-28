import Link from "next/link";
import { fetchAdminOverview } from "@/lib/admin/repository";
import { requireAdmin } from "@/lib/auth/roles";
import { formatNaira } from "@/lib/data/home";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { DashboardStatRow } from "@/components/dashboard/DashboardStatRow";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const stats = await fetchAdminOverview();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Platform control"
      title="Overview"
      description="Monitor orders, vendors, moderation queues, and payouts from one place."
      badge="Admin"
    >
      <DashboardStatRow
        stats={[
          { label: "Orders today", value: String(stats.ordersToday), accent: true },
          { label: "GMV today", value: formatNaira(stats.gmvToday) },
          { label: "Pending reviews", value: String(stats.pendingProductReviews) },
          { label: "Pending payouts", value: String(stats.pendingWithdrawals) },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/admin/vendors/applications"
          className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)] transition-colors hover:border-kay-gold/40"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
            Vendor applications
          </p>
          <p className="mt-2 font-serif text-[28px] text-kay-fg">
            {stats.pendingVendorApplications}
          </p>
          <p className="mt-2 text-[13px] text-kay-muted">Awaiting approval</p>
        </Link>
        <Link
          href="/admin/concierge"
          className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)] transition-colors hover:border-kay-gold/40"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
            Concierge
          </p>
          <p className="mt-2 font-serif text-[28px] text-kay-fg">
            {stats.pendingConcierge}
          </p>
          <p className="mt-2 text-[13px] text-kay-muted">Open requests</p>
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-sky-200/80 bg-sky-50/80 p-5">
        <p className="text-[13px] font-medium text-sky-950">Quick actions</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link
            href="/admin/products/review"
            className="rounded-full border border-sky-300 px-4 py-2 text-center text-[12px] font-medium text-sky-900 hover:bg-sky-100 sm:text-left"
          >
            Review products
          </Link>
          <Link
            href="/admin/vendors/invites"
            className="rounded-full border border-sky-300 px-4 py-2 text-center text-[12px] font-medium text-sky-900 hover:bg-sky-100 sm:text-left"
          >
            Invite vendor
          </Link>
          <Link
            href="/api/admin/export/orders"
            className="rounded-full border border-sky-300 px-4 py-2 text-center text-[12px] font-medium text-sky-900 hover:bg-sky-100 sm:text-left"
          >
            Export orders CSV
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
