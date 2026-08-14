import Link from "next/link";
import Image from "next/image";
import { requireVendor } from "@/lib/auth/roles";
import { fetchVendorProducts } from "@/lib/vendors/repository";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { formatPlacementSummary, hasAnyPlacement } from "@/lib/shop/taxonomy";
import { formatNaira } from "@/lib/data/home";
import { IconPackage, IconPlus } from "@/components/ui/Icons";

export default async function VendorProductsPage() {
  const { vendor } = await requireVendor();
  const products = await fetchVendorProducts(vendor.id);
  const live = products.filter((p) => p.status === "live").length;
  const lowStock = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity < 5,
  ).length;

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Catalogue"
      title="Your products"
      description={`${products.length} listings · ${live} live${
        lowStock ? ` · ${lowStock} low stock` : ""
      }. Publish with photos, stock, and categories.`}
      actions={
        <Link
          href="/vendor/products/new"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-kay-accent px-5 text-[12px] font-medium text-kay-accent-fg"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Add product
        </Link>
      }
    >
      {products.length === 0 ? (
        <DashboardEmptyState
          icon={<IconPackage className="h-6 w-6" />}
          title="Start your catalogue"
          description="Add your first luxury gift with up to 3 photos. Live listings appear on Kay immediately."
          actionHref="/vendor/products/new"
          actionLabel="Add product"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => {
            const cover = p.images?.[0];
            const placementOk = hasAnyPlacement(p);
            return (
              <li key={p.id}>
                <Link
                  href={`/vendor/products/${p.id}/edit`}
                  className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)] transition-all hover:border-kay-gold/40"
                >
                  <div className="relative aspect-[4/3] bg-kay-surface">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={p.name}
                        fill
                        sizes="320px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-kay-subtle">
                        <IconPackage className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <StatusBadge status={p.status ?? "draft"} />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="font-medium text-kay-fg">{p.name}</p>
                    <p className="mt-1 text-[12px] text-kay-muted">{p.brand}</p>
                    <p className="mt-3 font-serif text-[20px] text-kay-fg">
                      {formatNaira(p.price)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full border border-kay-border-light px-2.5 py-1 text-kay-muted">
                        {p.stock_quantity > 0
                          ? `${p.stock_quantity} in stock`
                          : "Out of stock"}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 ${
                          placementOk
                            ? "border-kay-border-light text-kay-muted"
                            : "border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {placementOk
                          ? formatPlacementSummary(p)
                          : "Needs categories"}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardLayout>
  );
}
