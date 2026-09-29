import Link from "next/link";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/shop/ProductCard";
import { ClearFiltersLink } from "@/components/shop/ClearFiltersLink";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-kay-border bg-kay-surface-elevated px-6 py-16 text-center">
        <p className="font-serif text-xl text-kay-fg">No gifts found</p>
        <p className="mt-2 max-w-sm text-[14px] text-kay-muted">
          Try adjusting your filters or browse our full collection.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ClearFiltersLink className="inline-flex h-10 items-center justify-center rounded-full bg-kay-fg px-6 text-[13px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90" />
          <Link
            href="/gifts"
            className="inline-flex h-10 items-center justify-center rounded-full border border-kay-fg px-6 text-[13px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
          >
            Browse all gifts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-7 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
