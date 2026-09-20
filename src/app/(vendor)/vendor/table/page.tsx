import Link from "next/link";
import { requireVendor } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { listTableRequests } from "@/lib/table/repository";
import { mapProductRow } from "@/types/product";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { TableRequestChat } from "@/components/table/TableRequestChat";
import { TABLE_STATUS_LABELS } from "@/components/table/TableRequestStatusTimeline";
import { formatNaira } from "@/lib/data/home";
import { isTableCatalogProduct } from "@/lib/table/catalog";

export default async function VendorTablePage() {
  const { vendor } = await requireVendor();

  if (!vendor.canListTable) {
    return (
      <DashboardLayout
        role="vendor"
        nav={VENDOR_NAV}
        eyebrow="Kay Kitchen"
        title="Edible gifts"
        description="Kay Kitchen access is granted by admin for bakers and edible makers."
      >
        <p className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 text-[14px] text-kay-muted">
          You do not have Kay Kitchen listing permission yet. Contact Kay admin to
          request access.
        </p>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();
  const { data: productRows } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const tableProducts = (productRows ?? [])
    .map(mapProductRow)
    .filter(isTableCatalogProduct);

  const requests = await listTableRequests({
    vendorId: vendor.id,
    limit: 50,
  });

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Kay Kitchen"
      title="Your table"
      description="Manage edible listings and reply to custom cake requests assigned to you."
    >
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
            Edible products
          </h2>
          <Link
            href="/vendor/products/new"
            className="text-[12px] font-medium text-kay-gold hover:underline"
          >
            Add product
          </Link>
        </div>
        <ul className="mt-4 space-y-2">
          {tableProducts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/vendor/products/${p.id}/edit`}
                className="flex items-center justify-between rounded-xl border border-kay-border-light bg-kay-surface-elevated px-4 py-3 text-[13px] hover:border-kay-fg/30"
              >
                <span className="font-medium text-kay-fg">{p.name}</span>
                <span className="text-kay-muted">{formatNaira(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
        {tableProducts.length === 0 && (
          <p className="mt-3 text-[13px] text-kay-muted">
            No Kay Kitchen products yet. Add a product and select the Kay Kitchen
            collection.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
          Assigned requests
        </h2>
        <ul className="mt-4 space-y-4">
          {requests.map((request) => (
            <li
              key={request.id}
              className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5"
            >
              <p className="font-serif text-[20px] text-kay-fg">
                {request.occasion || request.category}
              </p>
              <p className="text-[13px] text-kay-muted">
                {request.reference} · {TABLE_STATUS_LABELS[request.status]}
              </p>
              {request.flavourNotes && (
                <p className="mt-2 text-[13px] text-kay-muted">
                  {request.flavourNotes}
                </p>
              )}
              <div className="mt-4">
                <TableRequestChat requestId={request.id} viewerRole="vendor" />
              </div>
            </li>
          ))}
        </ul>
        {requests.length === 0 && (
          <p className="mt-3 text-[13px] text-kay-muted">
            No custom requests assigned to you yet.
          </p>
        )}
      </section>
    </DashboardLayout>
  );
}
