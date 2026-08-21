"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { formatNaira } from "@/lib/data/home";
import { IconSparkle } from "@/components/ui/Icons";
import {
  AddToCartButton,
  BuyNowButton,
  WishlistButton,
} from "@/components/cart/AddToCartButton";
import { CompareButton } from "@/components/compare/CompareButton";

type ProductInfoProps = {
  product: Product;
};

export function ProductInfo({ product }: ProductInfoProps) {
  const sizes = product.size_options ?? [];
  const [selectedSize, setSelectedSize] = useState(
    sizes.length === 1 ? sizes[0] : "",
  );
  const needsSize = sizes.length > 0;
  const sizeReady = !needsSize || Boolean(selectedSize);

  const badge = product.tags.includes("bestseller")
    ? "Bestseller"
    : product.tags.includes("new")
      ? "New Release"
      : product.tags.includes("exclusive")
        ? "Exclusive"
        : null;

  return (
    <div>
      {badge && (
        <span className="inline-block rounded bg-kay-beta-bg px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-kay-beta">
          {badge}
        </span>
      )}

      <p className="mt-3 text-[12px] uppercase tracking-wide text-kay-gold">
        {product.brand}
      </p>

      <h1 className="mt-1 font-serif text-[32px] leading-tight text-kay-fg sm:text-[36px]">
        {product.name}
      </h1>

      {(product.product_type || product.master_category) && (
        <p className="mt-2 text-[12px] text-kay-muted">
          {[product.master_category, product.product_type, product.color]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      <div className="mt-4 flex items-baseline gap-3">
        <p className="text-[22px] font-semibold text-kay-fg">
          {formatNaira(product.price)}
        </p>
        {product.compare_at_price != null &&
          product.compare_at_price > product.price && (
            <p className="text-[14px] text-kay-subtle line-through">
              {formatNaira(product.compare_at_price)}
            </p>
          )}
      </div>

      <p className="mt-5 text-[15px] leading-relaxed text-kay-muted">
        {product.description}
      </p>

      {needsSize && (
        <div className="mt-6">
          <label
            htmlFor="product-size"
            className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle"
          >
            Size
          </label>
          <select
            id="product-size"
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="h-11 w-full max-w-xs rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[13px] text-kay-fg outline-none focus:border-kay-fg"
          >
            <option value="">Select size</option>
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {product.in_stock ? (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-kay-muted">
          <span className="h-2 w-2 rounded-full bg-green-600" />
          {product.stock_quantity <= 5
            ? `Only ${product.stock_quantity} left in stock`
            : product.stock_quantity < 20
              ? `${product.stock_quantity} in stock — order soon`
              : "In stock and ready to ship"}
        </p>
      ) : (
        <p className="mt-4 text-[13px] text-kay-subtle">Out of stock</p>
      )}

      {product.compare_at_price != null &&
        product.compare_at_price > product.price && (
          <p className="mt-2 text-[12px] font-medium text-kay-gold">
            {Math.round(
              (1 - product.price / product.compare_at_price) * 100,
            )}
            % off
          </p>
        )}

      <div className="mt-8 flex flex-wrap gap-3">
        <AddToCartButton
          product={product}
          size={selectedSize || undefined}
          requireSize={needsSize}
          className="flex-1 sm:flex-none sm:min-w-[200px]"
        />
        <CompareButton product={product} />
        <WishlistButton />
      </div>

      <BuyNowButton
        product={product}
        size={selectedSize || undefined}
        requireSize={needsSize}
        className="mt-3"
      />
      {!sizeReady && product.in_stock && (
        <p className="mt-2 text-[12px] text-kay-muted">Select a size to continue.</p>
      )}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-kay-border-light bg-kay-surface px-4 py-3 text-[12px] text-kay-muted">
          Free delivery on orders over ₦100,000
        </div>
        <div className="rounded-lg border border-kay-border-light bg-kay-surface px-4 py-3 text-[12px] text-kay-muted">
          Kay luxury gift packaging included
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-lg bg-kay-surface px-4 py-3">
        <IconSparkle className="mt-0.5 shrink-0 text-kay-gold" />
        <p className="text-[12px] leading-relaxed text-kay-muted">
          Sending as a gift? Add at checkout — recipient note, anonymous delivery,
          and address collection available.
        </p>
      </div>
    </div>
  );
}
