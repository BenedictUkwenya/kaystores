import Link from "next/link";
import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapProductRow } from "@/types/product";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import {
  AdminProductCatalogue,
  type AdminProductRow,
} from "@/components/admin/AdminProductCatalogue";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { IconPackage, IconPlus, IconImport } from "@/components/ui/Icons";

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
        <AdminProductCatalogue products={products} />
      )}
    </DashboardLayout>
  );
}
