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
import { formatNaira } from "@/lib/data/home";
import type { Product } from "@/types/product";

export default async function AdminProductsPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin!.from("products").select("*").order("created_at", { ascending: false }).limit(100);
  const products = (data ?? []).map(mapProductRow);

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Catalogue"
      title="All products"
      badge="Admin"
    >
      <div className="mb-6">
        <Link
          href="/admin/products/review"
          className="rounded-full border border-kay-border px-4 py-2 text-[12px] font-medium hover:border-kay-gold"
        >
          Moderation queue
        </Link>
      </div>
      <DataTable<Product>
        rows={products}
        keyFn={(p) => p.id}
        columns={[
          { key: "name", header: "Name", render: (p) => p.name },
          { key: "brand", header: "Brand", render: (p) => p.brand },
          { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status ?? "live"} /> },
          { key: "price", header: "Price", render: (p) => formatNaira(p.price) },
        ]}
      />
    </DashboardLayout>
  );
}
