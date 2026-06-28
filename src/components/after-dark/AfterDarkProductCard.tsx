"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/types/product";
import { formatNaira } from "@/lib/data/home";
import { ProductCardActions } from "@/components/cart/ProductCardActions";

type AfterDarkProductCardProps = {
  product: Product;
  index?: number;
};

export function AfterDarkProductCard({
  product,
  index = 0,
}: AfterDarkProductCardProps) {
  const [imgSrc, setImgSrc] = useState(
    product.images[0] ?? "/after-dark/hero.png",
  );
  const isBestseller = product.tags.includes("bestseller");

  return (
    <article className="ad-product-card group flex flex-col">
      <div className="ad-product-image-wrap relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#121212] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <Link href={`/products/${product.slug}`} className="block overflow-hidden">
          {isBestseller && (
            <span className="ad-animate-badge absolute left-3 top-3 z-10 bg-ad-amber px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-black">
              Best Seller
            </span>
          )}
          <Image
            src={imgSrc}
            alt={product.name}
            width={400}
            height={480}
            className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            onError={() => setImgSrc("/after-dark/hero.png")}
          />
        </Link>
        <ProductCardActions product={product} />
      </div>
      <div
        className="mt-4"
        style={{ transitionDelay: `${index * 40}ms` }}
      >
        <p className="text-[10px] uppercase tracking-[0.16em] text-ad-amber/70">
          {product.brand}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="ad-shimmer-hover mt-1 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-[14px] font-medium leading-snug text-white transition-colors group-hover:from-ad-amber group-hover:via-ad-amber group-hover:to-ad-amber/80">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1.5 text-[15px] font-semibold tabular-nums text-white/95">
          {formatNaira(product.price)}
        </p>
      </div>
    </article>
  );
}
