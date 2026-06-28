"use client";

import Link from "next/link";
import Image from "next/image";
import { useCompare } from "@/providers/CompareProvider";
import { AdvancedComparisonTable } from "@/components/compare/AdvancedComparisonTable";
import { ComparePicker } from "@/components/compare/ComparePicker";
import { CompareTrustBar } from "@/components/compare/CompareTrustBar";
import { IconCompare, IconSparkle } from "@/components/ui/Icons";
import { MAX_COMPARE_PRODUCTS } from "@/types/compare";

export function ComparePageContent() {
  const { products, slugs, anchorSlug, isLoading, clearCompare } = useCompare();

  const anchorProduct =
    products.find((p) => p.slug === anchorSlug) ?? products[0];
  const showTable = products.length >= 2;

  return (
    <div className="compare-page">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-10 lg:px-14 lg:py-14">
        <nav className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-kay-subtle">
          <Link href="/" className="transition-colors hover:text-kay-fg">
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link href="/gifts" className="transition-colors hover:text-kay-fg">
            Gifts
          </Link>
          <span aria-hidden>/</span>
          <span className="text-kay-muted">Compare</span>
        </nav>

        <header className="mt-8 max-w-2xl">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-kay-gold">
            <IconSparkle className="h-3 w-3" />
            Side by side
          </p>
          <h1 className="mt-3 font-serif text-[28px] leading-[1.08] tracking-tight text-kay-fg sm:text-[38px] lg:text-[46px]">
            Compare gifts
          </h1>
          <p className="mt-4 text-[15px] leading-[1.7] text-kay-muted">
            Curated side-by-side view across price, availability, and gifting fit —
            search the catalog or let Kay AI suggest alternatives.
          </p>
        </header>

        {slugs.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
              Comparing
            </span>
            {products.map((product) => (
              <div
                key={product.id}
                className="inline-flex items-center gap-2.5 rounded-full border border-kay-border-light bg-kay-surface-elevated py-1.5 pl-1.5 pr-4 shadow-sm"
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-kay-surface">
                  <Image
                    src={product.images[0] ?? "/images/kay-hero-luxury-box.png"}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <span className="max-w-[140px] truncate text-[12px] font-medium text-kay-fg">
                  {product.name}
                </span>
              </div>
            ))}
            {slugs.length < MAX_COMPARE_PRODUCTS && (
              <span className="text-[12px] text-kay-subtle">
                + add up to {MAX_COMPARE_PRODUCTS - slugs.length} more
              </span>
            )}
          </div>
        )}

        {isLoading && products.length === 0 ? (
          <p className="mt-20 text-center text-[15px] text-kay-muted">
            Preparing your comparison…
          </p>
        ) : slugs.length === 0 ? (
          <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-kay-border bg-kay-surface-elevated/60 px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kay-gold-light/60 text-kay-gold">
              <IconCompare className="h-7 w-7" />
            </div>
            <p className="mt-6 font-serif text-[28px] text-kay-fg">
              Start comparing
            </p>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-kay-muted">
              Open any gift and tap Compare, or browse the catalog to build your
              shortlist.
            </p>
            <Link
              href="/gifts"
              className="mt-8 inline-flex h-11 items-center rounded-full bg-kay-fg px-8 text-[13px] font-medium tracking-wide text-kay-bg transition-opacity hover:opacity-90"
            >
              Browse gifts
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {products.length === 1 && anchorProduct && (
              <div className="flex items-start gap-4 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5 shadow-sm sm:p-6">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-kay-surface">
                  <Image
                    src={
                      anchorProduct.images[0] ??
                      "/images/kay-hero-luxury-box.png"
                    }
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-serif text-[20px] text-kay-fg">
                    {anchorProduct.name}
                  </p>
                  <p className="mt-1 text-[14px] text-kay-muted">
                    Add one more gift to unlock the full comparison view.
                  </p>
                </div>
              </div>
            )}

            {showTable && (
              <>
                <AdvancedComparisonTable products={products} />
                <CompareTrustBar />
              </>
            )}

            <ComparePicker
              anchorSlug={anchorSlug ?? slugs[0] ?? null}
              anchorProduct={anchorProduct}
            />

            {slugs.length > 0 && (
              <div className="flex justify-center border-t border-kay-border-light pt-8">
                <button
                  type="button"
                  onClick={clearCompare}
                  className="text-[12px] font-medium uppercase tracking-[0.12em] text-kay-subtle transition-colors hover:text-kay-fg"
                >
                  Clear comparison
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
