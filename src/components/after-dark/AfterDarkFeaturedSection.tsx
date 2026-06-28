"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { AFTER_DARK_COPY } from "@/lib/after-dark/catalog";
import { AfterDarkProductCard } from "@/components/after-dark/AfterDarkProductCard";
import { AfterDarkReveal } from "@/components/after-dark/AfterDarkReveal";

type SortOption = "featured" | "price-asc" | "price-desc";

type AfterDarkFeaturedSectionProps = {
  products: Product[];
};

export function AfterDarkFeaturedSection({
  products,
}: AfterDarkFeaturedSectionProps) {
  const [sort, setSort] = useState<SortOption>("featured");

  const sorted = useMemo(() => {
    const list = [...products];
    if (sort === "price-asc") return list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return list.sort((a, b) => b.price - a.price);
    return list.sort((a, b) => {
      const aBest = a.tags.includes("bestseller") ? 1 : 0;
      const bBest = b.tags.includes("bestseller") ? 1 : 0;
      if (bBest !== aBest) return bBest - aBest;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [products, sort]);

  return (
    <section
      id="selections"
      className="relative scroll-mt-20 bg-black px-4 py-20 lg:px-10 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent"
        aria-hidden
      />

      <div className="mx-auto max-w-[1280px]">
        <AfterDarkReveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-ad-amber/75">
                Handpicked for the night
              </p>
              <h2 className="mt-2 font-serif text-[34px] text-white sm:text-[40px]">
                {AFTER_DARK_COPY.featuredTitle}
              </h2>
              <div className="ad-animate-line mt-4 h-0.5 w-full max-w-xs bg-ad-amber" />
            </div>
            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor="after-dark-sort">
                Sort products
              </label>
              <select
                id="after-dark-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="h-10 rounded-lg border border-white/15 bg-[#141414] px-3 text-[13px] text-white/80 outline-none transition-colors focus:border-ad-amber"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </AfterDarkReveal>

        <div className="mt-12 grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-4">
          {sorted.map((product, index) => (
            <AfterDarkReveal key={product.id} delay={index * 80}>
              <AfterDarkProductCard product={product} index={index} />
            </AfterDarkReveal>
          ))}
        </div>

        {sorted.length === 0 && (
          <p className="mt-12 text-center text-[14px] text-white/50">
            Our intimate edit is being refreshed. Check back soon.
          </p>
        )}
      </div>
    </section>
  );
}
