"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import {
  TABLE_CATEGORIES,
  TABLE_COPY,
  TABLE_ROUTES,
} from "@/lib/table/catalog";
import { TableProductCard } from "@/components/table/TableProductCard";

type SortOption = "featured" | "price-asc" | "price-desc";

type Props = {
  products: Product[];
  activeTag?: string | null;
};

export function TableCatalogSection({ products, activeTag }: Props) {
  const [sort, setSort] = useState<SortOption>("featured");

  const sorted = useMemo(() => {
    const list = [...products];
    if (sort === "price-asc") return list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, sort]);

  return (
    <section
      id="selections"
      className="relative scroll-mt-20 px-4 py-16 lg:px-10 lg:py-20"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--table-berry)]">
              Ready to gift
            </p>
            <h2 className="mt-2 font-serif text-[32px] text-[var(--table-cocoa)] sm:text-[40px]">
              {TABLE_COPY.featuredTitle}
            </h2>
            <div className="table-animate-line mt-4 h-0.5 w-full max-w-xs bg-[var(--table-cocoa)]/40" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="table-sort">
              Sort products
            </label>
            <select
              id="table-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="h-10 rounded-lg border border-[var(--table-line)] bg-[var(--table-paper)] px-3 text-[13px] text-[var(--table-ink)] outline-none focus:border-[var(--table-cocoa)]"
            >
              <option value="featured">Discover (mixed)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/table"
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
              !activeTag
                ? "bg-[var(--table-cocoa)] text-[var(--table-paper)]"
                : "border border-[var(--table-line)] text-[var(--table-muted)] hover:border-[var(--table-cocoa)]"
            }`}
          >
            All
          </Link>
          {TABLE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/table?tag=${cat.tag}`}
              className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
                activeTag === cat.tag
                  ? "bg-[var(--table-cocoa)] text-[var(--table-paper)]"
                  : "border border-[var(--table-line)] text-[var(--table-muted)] hover:border-[var(--table-cocoa)]"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-4">
          {sorted.map((product, index) => (
            <TableProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-[14px] text-[var(--table-muted)]">
              The table is being set. Request a custom cake while we add more.
            </p>
            <Link
              href={TABLE_ROUTES.request}
              className="table-cta mt-6 inline-flex h-11 items-center justify-center rounded-lg px-8 text-[13px] font-semibold"
            >
              {TABLE_COPY.heroRequest}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
