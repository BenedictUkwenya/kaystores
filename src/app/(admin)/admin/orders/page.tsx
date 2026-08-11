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
import { formatNaira } from "@/lib/data/home";
import type { Order } from "@/types/order";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const rows = await fetchAllOrdersAdmin();
  const orders = rows.map((r) => mapOrderRow(r as never));

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Operations"
      title="Orders"
      badge="Admin"
    >
      <DataTable<Order>
        rows={orders}
        keyFn={(o) => o.id}
        columns={[
          {
            key: "ref",
            header: "Reference",
            render: (o) => (
              <Link href={`/admin/orders/${o.id}`} className="hover:text-kay-gold">
                {o.orderNumber}
              </Link>
            ),
          },
          { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
          {
            key: "total",
            header: "Total",
            render: (o) => formatNaira(o.pricing.grandTotal),
          },
          {
            key: "buyer",
            header: "Buyer",
            render: (o) => o.buyer.email,
          },
          {
            key: "type",
            header: "Type",
            render: (o) =>
              o.deliveryType === "gift" ? (
                <span className="text-kay-gold">Gift · Reveal</span>
              ) : (
                "Self"
              ),
          },
        ]}
      />
    </DashboardLayout>
  );
}
