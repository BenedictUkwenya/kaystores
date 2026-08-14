import Link from "next/link";
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
      description="Every listing on Kay — vendor and platform catalogue. Prices shown are vendor list prices; customer prices use Pricing tiers."
      badge="Admin"
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/products/import"
          className="rounded-full border border-kay-border px-4 py-2 text-[12px] font-medium hover:border-kay-fg"
        >
          Import
        </Link>
        <Link
          href="/admin/products/new"
          className="rounded-full border border-kay-border px-4 py-2 text-[12px] font-medium hover:border-kay-fg"
        >
          Add one product
        </Link>
      </div>
      <DataTable<Product>
        rows={products}
        keyFn={(p) => p.id}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (p) => (
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="font-medium hover:text-kay-gold"
              >
                {p.name}
              </Link>
            ),
          },
          { key: "brand", header: "Brand", render: (p) => p.brand },
          {
            key: "owner",
            header: "Owner",
            render: (p) =>
              p.vendor_id ? (
                <span className="text-kay-muted">Vendor listing</span>
              ) : (
                <span className="font-medium text-kay-gold">Kay Stores</span>
              ),
          },
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
          { key: "price", header: "List price", render: (p) => formatNaira(p.price) },
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
