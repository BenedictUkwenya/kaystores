"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/types/product";
import { formatNaira } from "@/lib/data/home";
import { ProductCardActions } from "@/components/cart/ProductCardActions";

type Props = {
  product: Product;
  index?: number;
};

export function TableProductCard({ product, index = 0 }: Props) {
  const [imgSrc, setImgSrc] = useState(
    product.images[0] ?? "/brand/kay-logo-light.png",
  );

  return (
    <article className="table-product-card group flex flex-col">
      <div className="table-product-image-wrap relative overflow-hidden rounded-2xl border border-[var(--table-line)] bg-[var(--table-paper)]">
        <Link href={`/products/${product.slug}`} className="block overflow-hidden">
          <Image
            src={imgSrc}
            alt={product.name}
            width={400}
            height={480}
            className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            onError={() => setImgSrc("/brand/kay-logo-light.png")}
          />
        </Link>
        <ProductCardActions product={product} />
      </div>
      <div className="mt-4" style={{ transitionDelay: `${index * 40}ms` }}>
        <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--table-berry)]">
          {product.brand}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 text-[14px] font-medium leading-snug text-[var(--table-ink)] transition-colors group-hover:text-[var(--table-cocoa)]">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1.5 text-[15px] font-semibold tabular-nums text-[var(--table-cocoa)]">
          {formatNaira(product.price)}
        </p>
      </div>
    </article>
  );
}
