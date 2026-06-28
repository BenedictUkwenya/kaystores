import Link from "next/link";
import type { Product } from "@/types/product";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { IconArrowRight } from "@/components/ui/Icons";

type RelatedProductsProps = {
  products: Product[];
};

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-kay-border-light pt-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[24px] text-kay-fg">
            Complete the gift
          </h2>
          <p className="mt-1 text-[13px] text-kay-muted">
            Frequently paired with this item
          </p>
        </div>
        <Link
          href="/gifts"
          className="hidden items-center gap-1 text-[13px] font-medium text-kay-muted transition-colors hover:text-kay-fg sm:flex"
        >
          View all
          <IconArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
