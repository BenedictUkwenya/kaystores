"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatNaira } from "@/lib/data/home";
import {
  getBestValueSlug,
  getHighlightedSlugs,
  mergeSpecKeys,
} from "@/lib/compare/highlights";
import { useCompare } from "@/providers/CompareProvider";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { IconBag, IconX } from "@/components/ui/Icons";

type AdvancedComparisonTableProps = {
  products: Product[];
};

type CompareRowDef = {
  id: string;
  label: string;
  render: (product: Product) => React.ReactNode;
  textValue: (product: Product) => string;
};

function CompareTags({ product }: { product: Product }) {
  const tags = [...product.recipients, ...product.occasions]
    .slice(0, 4)
    .map((item) => item.replace(/-/g, " "));

  if (tags.length === 0) return <span className="text-kay-subtle">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="compare-tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

function StockBadge({ inStock }: { inStock: boolean }) {
  if (!inStock) {
    return (
      <span className="text-[13px] text-kay-subtle">Currently unavailable</span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-kay-fg">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
      Ready to ship
    </span>
  );
}

export function AdvancedComparisonTable({
  products,
}: AdvancedComparisonTableProps) {
  const { removeProduct } = useCompare();
  const bestValueSlug = getBestValueSlug(products);
  const specKeys = mergeSpecKeys(products);

  if (products.length < 2) return null;

  const rows: CompareRowDef[] = [
    {
      id: "availability",
      label: "Availability",
      render: (p) => <StockBadge inStock={p.in_stock} />,
      textValue: (p) => (p.in_stock ? "In stock" : "Out of stock"),
    },
    {
      id: "brand",
      label: "Brand",
      render: (p) => (
        <span className="font-medium tracking-wide text-kay-fg">{p.brand}</span>
      ),
      textValue: (p) => p.brand,
    },
    {
      id: "best-for",
      label: "Best for",
      render: (p) => <CompareTags product={p} />,
      textValue: (p) =>
        [...p.recipients, ...p.occasions].slice(0, 4).join(" ") || "—",
    },
    ...specKeys.map((key) => ({
      id: `spec-${key}`,
      label: key,
      render: (p: Product) => (
        <span className="text-kay-fg">{p.specs[key] ?? "—"}</span>
      ),
      textValue: (p: Product) => p.specs[key] ?? "—",
    })),
    {
      id: "packaging",
      label: "Packaging",
      render: () => (
        <span className="text-kay-fg">Kay signature gift wrapping</span>
      ),
      textValue: () => "Kay signature gift wrapping",
    },
  ];

  const colCount = products.length;

  return (
    <div className="compare-matrix">
      <p className="mb-2 text-[11px] text-kay-subtle lg:hidden">Swipe to compare →</p>
      <div className="compare-matrix-scroll compare-matrix-scroll-hint">
        <div
          className="compare-matrix-grid"
          style={{
            gridTemplateColumns: `minmax(128px, 148px) repeat(${colCount}, minmax(220px, 1fr))`,
          }}
        >
          {/* Header corner */}
          <div className="compare-row-label !border-r !bg-kay-surface-elevated !text-[9px]">
            Gift
          </div>

          {/* Product headers */}
          {products.map((product, index) => {
            const isBest = bestValueSlug === product.slug;
            const isLast = index === colCount - 1;

            return (
              <div
                key={`header-${product.id}`}
                className={`compare-product-header compare-col-divider ${
                  isBest ? "compare-col-best" : ""
                } ${isLast ? "!border-r-0" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => removeProduct(product.slug)}
                  aria-label={`Remove ${product.name}`}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-kay-border-light bg-kay-bg/80 text-kay-subtle backdrop-blur-sm transition-colors hover:border-kay-fg hover:text-kay-fg"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>

                {isBest && (
                  <span className="compare-best-badge">Best value</span>
                )}

                <div className="compare-product-image">
                  <Image
                    src={product.images[0] ?? "/images/kay-hero-luxury-box.png"}
                    alt={product.name}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>

                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
                  {product.brand}
                </p>

                <Link
                  href={`/products/${product.slug}`}
                  className="mt-1.5 block font-serif text-[20px] leading-snug text-kay-fg transition-opacity hover:opacity-70"
                >
                  {product.name}
                </Link>

                <p className="mt-3 font-serif text-[26px] tracking-tight text-kay-gold">
                  {formatNaira(product.price)}
                </p>

                {product.compare_at_price != null &&
                  product.compare_at_price > product.price && (
                    <p className="mt-0.5 text-[13px] text-kay-subtle line-through">
                      {formatNaira(product.compare_at_price)}
                    </p>
                  )}

                <Link
                  href={`/products/${product.slug}`}
                  className="mt-4 inline-block text-[12px] font-medium uppercase tracking-[0.12em] text-kay-muted underline-offset-4 transition-colors hover:text-kay-fg hover:underline"
                >
                  View details
                </Link>
              </div>
            );
          })}

          {/* Spec rows */}
          {rows.map((row) => {
            const winners = getHighlightedSlugs(
              row.id,
              products,
              row.textValue,
            );

            return (
              <div key={row.id} className="contents">
                <div className="compare-row-label">{row.label}</div>

                {products.map((product, index) => {
                  const highlighted = winners.has(product.slug);
                  const isLast = index === colCount - 1;

                  return (
                    <div
                      key={`${row.id}-${product.id}`}
                      className={`compare-cell compare-col-divider ${
                        highlighted ? "is-winner" : ""
                      } ${bestValueSlug === product.slug ? "compare-col-best" : ""} ${
                        isLast ? "!border-r-0" : ""
                      }`}
                    >
                      {row.render(product)}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* CTA row */}
          <div className="compare-row-label !min-h-0 !py-6">Action</div>

          {products.map((product, index) => {
            const isLast = index === colCount - 1;

            return (
              <div
                key={`cta-${product.id}`}
                className={`compare-cta-cell compare-col-divider ${
                  bestValueSlug === product.slug ? "compare-col-best" : ""
                } ${isLast ? "!border-r-0" : ""}`}
              >
                <AddToCartButton
                  product={product}
                  className="!h-12 w-full !rounded-full !border-0 !bg-kay-fg !text-[13px] !font-semibold !tracking-wide !text-kay-bg shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:!-translate-y-0.5 hover:!brightness-100 hover:!shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
                >
                  <span className="inline-flex items-center gap-2">
                    <IconBag className="h-4 w-4" />
                    Add to Bag
                  </span>
                </AddToCartButton>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
