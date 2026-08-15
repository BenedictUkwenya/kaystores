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
import { AdminProductActions } from "@/components/admin/AdminProductActions";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { formatPlacementSummary } from "@/lib/shop/taxonomy";
import { formatNaira } from "@/lib/data/home";
import { IconPackage, IconPlus, IconImport } from "@/components/ui/Icons";
import type { Product } from "@/types/product";

type AdminProductRow = Product & { vendorName: string | null };

export default async function AdminProductsPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin!
    .from("products")
    .select("*, vendors(business_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const products: AdminProductRow[] = (data ?? []).map((row) => {
    const product = mapProductRow(row as Record<string, unknown>);
    const vendorsRaw = (row as { vendors?: { business_name?: string } | null })
      .vendors;
    const vendorName =
      vendorsRaw && typeof vendorsRaw === "object"
        ? vendorsRaw.business_name
        : null;
    return { ...product, vendorName: vendorName ? String(vendorName) : null };
  });
  const kayOwned = products.filter((p) => !p.vendor_id).length;
  const live = products.filter((p) => p.status === "live").length;

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Catalogue"
      title="All products"
      description={`${products.length} listings · ${live} live · ${kayOwned} Kay-owned. Use Edit or Delete on any vendor or Kay listing.`}
      badge="Admin"
      actions={
        <>
          <Link
            href="/admin/products/import"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-kay-border px-4 text-[12px] font-medium text-kay-fg hover:border-kay-fg"
          >
            <IconImport className="h-3.5 w-3.5" />
            Import
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-kay-accent px-4 text-[12px] font-medium text-kay-accent-fg"
          >
            <IconPlus className="h-3.5 w-3.5" />
            Add product
          </Link>
        </>
      }
    >
      {products.length === 0 ? (
        <DashboardEmptyState
          icon={<IconPackage className="h-6 w-6" />}
          title="Catalogue is empty"
          description="Add a Kay-owned gift or invite a vendor and import their SKUs."
          actionHref="/admin/products/new?owner=kay"
          actionLabel="Add Kay product"
          secondaryHref="/admin/products/import"
          secondaryLabel="Import CSV"
        />
      ) : (
        <DataTable<AdminProductRow>
          rows={products}
          keyFn={(p) => p.id}
          columns={[
            {
              key: "name",
              header: "Product",
              render: (p) => (
                <div>
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="font-medium hover:text-kay-gold"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-[11px] text-kay-subtle">
                    {p.sku}
                  </p>
                </div>
              ),
            },
            { key: "brand", header: "Brand", render: (p) => p.brand },
            {
              key: "owner",
              header: "Owner",
              render: (p) =>
                p.vendor_id ? (
                  <Link
                    href={`/admin/vendors/${p.vendor_id}`}
                    className="text-kay-muted hover:text-kay-gold"
                  >
                    {p.vendorName ?? "Vendor"}
                  </Link>
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
              key: "stock",
              header: "Stock",
              render: (p) =>
                p.stock_quantity > 0 ? (
                  <span>{p.stock_quantity}</span>
                ) : (
                  <span className="text-amber-700">Out</span>
                ),
            },
            {
              key: "status",
              header: "Status",
              render: (p) => <StatusBadge status={p.status ?? "live"} />,
            },
            {
              key: "price",
              header: "List price",
              render: (p) => formatNaira(p.price),
            },
            {
              key: "actions",
              header: "Manage",
              render: (p) => (
                <AdminProductActions productId={p.id} productName={p.name} />
              ),
            },
            {
              key: "badges",
              header: "Badges",
              hideOnMobile: true,
              render: (p) => <AdminProductTagEditor product={p} />,
            },
          ]}
        />
      )}
    </DashboardLayout>
  );
}
