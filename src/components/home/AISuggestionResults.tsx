"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatNaira } from "@/lib/data/home";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

type AISuggestionResultsProps = {
  message: string;
  products: Product[];
  onClose: () => void;
};

export function AISuggestionResults({
  message,
  products,
  onClose,
}: AISuggestionResultsProps) {
  if (products.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-kay-border bg-kay-surface-elevated p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] leading-relaxed text-kay-muted">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[12px] text-kay-subtle transition-colors hover:text-kay-fg"
        >
          Clear
        </button>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex gap-3 rounded-lg border border-kay-border-light bg-kay-bg p-3"
          >
            <Link
              href={`/products/${product.slug}`}
              className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-kay-surface"
            >
              <Image
                src={product.images[0] ?? "/images/kay-hero-luxury-box.png"}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-[10px] uppercase tracking-wide text-kay-gold">
                {product.brand}
              </p>
              <Link
                href={`/products/${product.slug}`}
                className="truncate text-[13px] font-medium text-kay-fg hover:opacity-70"
              >
                {product.name}
              </Link>
              <p className="mt-0.5 text-[13px] font-semibold text-kay-fg">
                {formatNaira(product.price)}
              </p>
              <AddToCartButton
                product={product}
                className="mt-auto !h-9 w-full !px-3 !text-[12px]"
              >
                Add to Bag
              </AddToCartButton>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-center text-[11px] text-kay-subtle">
        Suggestions powered by Kay AI (demo mode — real AI coming soon)
      </p>
    </div>
  );
}
