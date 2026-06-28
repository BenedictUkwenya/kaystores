import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/product";
import { formatNaira } from "@/lib/data/home";
import { ProductCardActions } from "@/components/cart/ProductCardActions";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0] ?? "/images/kay-hero-luxury-box.png";
  const isBestseller = product.tags.includes("bestseller");
  const isNew = product.tags.includes("new");

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden rounded-lg bg-kay-surface">
        <Link href={`/products/${product.slug}`} className="block">
          {(isBestseller || isNew) && (
            <span className="absolute left-2.5 top-2.5 z-10 bg-kay-fg px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-kay-accent-fg">
              {isBestseller ? "Bestseller" : "New"}
            </span>
          )}
          <Image
            src={image}
            alt={product.name}
            width={400}
            height={480}
            className="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
        <ProductCardActions product={product} />
      </div>
      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-wide text-kay-gold">
          {product.brand}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-0.5 text-[13px] font-medium leading-snug text-kay-fg transition-opacity hover:opacity-70">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-[14px] font-semibold text-kay-fg">
            {formatNaira(product.price)}
          </p>
          {product.compare_at_price != null &&
            product.compare_at_price > product.price && (
              <p className="text-[12px] text-kay-subtle line-through">
                {formatNaira(product.compare_at_price)}
              </p>
            )}
        </div>
      </div>
    </article>
  );
}
