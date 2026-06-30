import Link from "next/link";
import { requireVendor } from "@/lib/auth/roles";
import { fetchVendorProducts } from "@/lib/vendors/repository";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatPlacementSummary, hasAnyPlacement } from "@/lib/shop/taxonomy";
import { formatNaira } from "@/lib/data/home";
import type { Product } from "@/types/product";

export default async function VendorProductsPage() {
  const { vendor } = await requireVendor();
  const products = await fetchVendorProducts(vendor.id);

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Catalogue"
      title="Your products"
      description="Create listings and manage stock. Published products go live on Kay immediately."
    >
      <div className="mb-6 flex justify-end">
        <Link
          href="/vendor/products/new"
          className="inline-flex h-11 items-center justify-center rounded-full bg-kay-accent px-8 text-[13px] font-medium text-kay-accent-fg"
        >
          Add product
        </Link>
      </div>

      <DataTable<Product>
        rows={products}
        keyFn={(p) => p.id}
        emptyMessage="No products yet. Add your first listing."
        columns={[
          {
            key: "name",
            header: "Product",
            render: (p) => (
              <div>
                <Link
                  href={`/vendor/products/${p.id}/edit`}
                  className="hover:text-kay-gold"
                >
                  {p.name}
                </Link>
                {!hasAnyPlacement(p) && p.status === "live" && (
                  <p className="mt-0.5 text-[11px] text-amber-700">
                    Not in any category yet — edit to add shop placement
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (p) => <StatusBadge status={p.status ?? "draft"} />,
          },
          {
            key: "placement",
            header: "Shop categories",
            render: (p) => (
              <span className="text-[12px] text-kay-muted">
                {formatPlacementSummary(p)}
              </span>
            ),
          },
          { key: "price", header: "Price", render: (p) => formatNaira(p.price) },
          {
            key: "stock",
            header: "Stock",
            render: (p) =>
              p.stock_quantity > 0 ? `${p.stock_quantity} units` : "Out of stock",
          },
        ]}
      />
    </DashboardLayout>
  );
}
