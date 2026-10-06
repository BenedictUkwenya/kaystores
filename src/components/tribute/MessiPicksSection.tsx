import Link from "next/link";
import type { Product } from "@/types/product";
import { TRIBUTE_COPY } from "@/lib/tribute";
import { ProductCard } from "@/components/shop/ProductCard";
import { IconArrowRight } from "@/components/ui/Icons";

export function MessiPicksSection({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <section
      id="messi-picks"
      className="scroll-mt-24 bg-kay-bg px-4 py-12 lg:px-10 lg:py-16"
      aria-label={TRIBUTE_COPY.picksTitle}
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="kay-messi-marquee rounded-2xl px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kay-messi-eyebrow">{TRIBUTE_COPY.picksTitle}</p>
              <h2 className="mt-2 font-serif text-[28px] text-kay-fg sm:text-[34px]">
                {TRIBUTE_COPY.picksSub}
              </h2>
              <p className="mt-2 max-w-md text-[13px] leading-relaxed text-kay-muted">
                Watches, sneakers, scent and the odd phone. Picked from the Kay catalogue
                for the man who already has every trophy.
              </p>
            </div>
            <Link
              href="/gifts/recipient/for-him"
              className="flex items-center gap-1 text-[13px] font-medium text-kay-muted transition-colors hover:text-kay-fg"
            >
              More gifts for him
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="relative">
              <span className="kay-messi-tag">No.10 pick</span>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
