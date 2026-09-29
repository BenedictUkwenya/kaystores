"use client";

import Link from "next/link";
import type { Product } from "@/types/product";
import { useCart } from "@/providers/CartProvider";
import { IconBag } from "@/components/ui/Icons";

type ProductCardActionsProps = {
  product: Product;
};

const reveal = "opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100";

export function ProductCardActions({ product }: ProductCardActionsProps) {
  const { addItem } = useCart();
  const options = product.variation?.options ?? [];
  const legacySizes = product.size_options ?? [];
  const singleOption = options.length === 1 ? options[0] : null;
  const needsChoice =
    options.length > 1 || (options.length === 0 && legacySizes.length > 0);

  if (needsChoice && product.in_stock) {
    return (
      <Link
        href={`/products/${product.slug}`}
        className={`absolute bottom-3 right-3 z-10 inline-flex h-9 items-center justify-center rounded-full bg-kay-accent px-4 text-[12px] font-medium text-kay-accent-fg shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${reveal}`}
      >
        Choose options
      </Link>
    );
  }

  const disabled = !product.in_stock || (singleOption != null && singleOption.stock <= 0);

  return (
    <button
      type="button"
      aria-label={`Add ${product.name} to cart`}
      disabled={disabled}
      onClick={() =>
        addItem(product, 1, singleOption ? { variationOptionId: singleOption.id } : undefined)
      }
      className={`absolute bottom-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-kay-accent text-kay-accent-fg shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100 ${
        disabled ? "opacity-40" : reveal
      }`}
    >
      <IconBag className="h-4 w-4" />
    </button>
  );
}
