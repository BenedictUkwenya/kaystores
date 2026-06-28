import type { Product } from "@/types/product";
import { ProductCard } from "@/components/shop/ProductCard";

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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-7 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
