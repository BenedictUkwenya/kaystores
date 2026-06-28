"use client";

import Link from "next/link";
import type { Product } from "@/types/product";
import { useCompare } from "@/providers/CompareProvider";
import { ComparePicker } from "@/components/compare/ComparePicker";
import { IconArrowRight, IconSparkle } from "@/components/ui/Icons";

type ProductComparePanelProps = {
  product: Product;
};

export function ProductComparePanel({ product }: ProductComparePanelProps) {
  const { slugs } = useCompare();

  return (
    <section className="mt-16 border-t border-kay-border-light pt-12">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
        <IconSparkle className="h-3 w-3" />
        Compare
      </p>
      <h2 className="mt-2 font-serif text-[30px] leading-tight text-kay-fg sm:text-[34px]">
        See how this gift stacks up
      </h2>
      <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-kay-muted">
        Search the catalog or let Kay AI suggest alternatives — then open the full
        side-by-side comparison.
      </p>

      <div className="mt-8">
        <ComparePicker anchorSlug={product.slug} anchorProduct={product} />
      </div>

      {slugs.length > 0 && (
        <Link
          href="/compare"
          className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-kay-fg transition-opacity hover:opacity-70"
        >
          Open full comparison
          <IconArrowRight />
        </Link>
      )}
    </section>
  );
}
