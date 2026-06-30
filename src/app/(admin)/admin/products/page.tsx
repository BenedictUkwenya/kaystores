import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapProductRow } from "@/types/product";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { AdminProductTagEditor } from "@/components/admin/AdminProductTagEditor";
import { formatPlacementSummary } from "@/lib/shop/taxonomy";
import { formatNaira } from "@/lib/data/home";
import type { Product } from "@/types/product";

export default async function AdminProductsPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin!
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  const products = (data ?? []).map(mapProductRow);

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Catalogue"
      title="All products"
      description="Every listing on Kay — vendor and platform catalogue."
      badge="Admin"
    >
      <DataTable<Product>
        rows={products}
        keyFn={(p) => p.id}
        columns={[
          { key: "name", header: "Name", render: (p) => p.name },
          { key: "brand", header: "Brand", render: (p) => p.brand },
          {
            key: "placement",
            header: "Placement",
            render: (p) => (
              <span className="text-[12px] text-kay-muted">
                {formatPlacementSummary(p)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (p) => <StatusBadge status={p.status ?? "live"} />,
          },
          { key: "price", header: "Price", render: (p) => formatNaira(p.price) },
          {
            key: "badges",
            header: "Badges",
            render: (p) => <AdminProductTagEditor product={p} />,
          },
        ]}
      />
    </DashboardLayout>
  );
}
