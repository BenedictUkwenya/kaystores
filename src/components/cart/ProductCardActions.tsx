"use client";

import type { Product } from "@/types/product";
import { useCart } from "@/providers/CartProvider";
import { IconBag, IconHeart } from "@/components/ui/Icons";

type ProductCardActionsProps = {
  product: Product;
};

export function ProductCardActions({ product }: ProductCardActionsProps) {
  const { addItem } = useCart();

  return (
    <>
      <button
        type="button"
        aria-label="Add to wishlist"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-transparent bg-kay-bg/90 text-kay-muted shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-kay-border hover:bg-kay-bg hover:text-kay-fg hover:shadow-md active:scale-95"
      >
        <IconHeart />
      </button>
      <button
        type="button"
        aria-label="Add to cart"
        disabled={!product.in_stock}
        onClick={() => addItem(product)}
        className="absolute bottom-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-kay-accent text-kay-accent-fg opacity-0 shadow-md transition-all duration-200 group-hover:opacity-100 hover:-translate-y-0.5 hover:scale-110 hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
      >
        <IconBag className="h-4 w-4" />
      </button>
    </>
  );
}
