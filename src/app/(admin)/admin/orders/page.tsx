import Link from "next/link";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllOrdersAdmin } from "@/lib/admin/repository";
import { mapOrderRow } from "@/lib/orders/map";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { formatNaira } from "@/lib/data/home";
import { IconOrders } from "@/components/ui/Icons";
import type { Order } from "@/types/order";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const rows = await fetchAllOrdersAdmin();
  const orders = rows.map((r) => mapOrderRow(r as never));
  const giftCount = orders.filter((o) => o.deliveryType === "gift").length;
  const paidCount = orders.filter((o) => o.paymentStatus === "paid").length;

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Operations"
      title="Orders"
      description={`${orders.length} recent orders · ${giftCount} gifts · ${paidCount} paid. Open any reference for fulfilment detail.`}
      badge="Admin"
      actions={
        <Link
          href="/api/admin/export/orders"
          className="inline-flex h-10 items-center rounded-full border border-kay-border px-5 text-[12px] font-medium text-kay-fg hover:border-kay-fg"
        >
          Export CSV
        </Link>
      }
    >
      {orders.length === 0 ? (
        <DashboardEmptyState
          icon={<IconOrders className="h-6 w-6" />}
          title="No orders yet"
          description="When shoppers check out, they will appear here with gift/self delivery context and hub fulfilment steps."
        />
      ) : (
        <DataTable<Order>
          rows={orders}
          keyFn={(o) => o.id}
          columns={[
            {
              key: "ref",
              header: "Reference",
              render: (o) => (
                <div>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-medium hover:text-kay-gold"
                  >
                    {o.orderNumber}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-kay-subtle">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (o) => <StatusBadge status={o.status} />,
            },
            {
              key: "payment",
              header: "Payment",
              render: (o) => (
                <StatusBadge
                  status={o.paymentStatus ?? "unpaid"}
                  label={o.paymentStatus ?? "unpaid"}
                />
              ),
            },
            {
              key: "total",
              header: "Total",
              render: (o) => (
                <span className="font-serif text-[16px]">
                  {formatNaira(o.pricing.grandTotal)}
                </span>
              ),
            },
            {
              key: "buyer",
              header: "Buyer",
              render: (o) => (
                <div>
                  <p>{o.buyer.email}</p>
                  {o.buyer.fullName && (
                    <p className="text-[11px] text-kay-subtle">
                      {o.buyer.fullName}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (o) =>
                o.deliveryType === "gift" ? (
                  <span className="font-medium text-kay-gold">Gift · Reveal</span>
                ) : (
                  <span className="text-kay-muted">Self delivery</span>
                ),
            },
            {
              key: "items",
              header: "Items",
              hideOnMobile: true,
              render: (o) => (
                <span className="text-kay-muted">
                  {o.items?.length ?? 0} line
                  {(o.items?.length ?? 0) === 1 ? "" : "s"}
                </span>
              ),
            },
          ]}
        />
      )}
    </DashboardLayout>
  );
}
