"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "@/types/cart";
import { formatNaira } from "@/lib/data/home";
import { useCart } from "@/providers/CartProvider";
import { IconMinus, IconPlus, IconX } from "@/components/ui/Icons";

type CartLineItemProps = {
  item: CartItem;
};

export function CartLineItem({ item }: CartLineItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <li className="flex gap-3 border-b border-kay-border-light py-4 last:border-b-0">
      <Link
        href={`/products/${item.slug}`}
        className="relative h-[88px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-kay-surface"
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="72px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-kay-gold">
              {item.brand}
            </p>
            <Link
              href={`/products/${item.slug}`}
              className="mt-0.5 block truncate text-[13px] font-medium text-kay-fg hover:opacity-70"
            >
              {item.name}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            aria-label={`Remove ${item.name}`}
            className="shrink-0 p-1 text-kay-subtle transition-colors hover:text-kay-fg"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center rounded-full border border-kay-border">
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-8 w-8 items-center justify-center text-kay-muted transition-colors hover:text-kay-fg disabled:opacity-30"
            >
              <IconMinus />
            </button>
            <span className="w-8 text-center text-[13px] tabular-nums text-kay-fg">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              aria-label="Increase quantity"
              className="flex h-8 w-8 items-center justify-center text-kay-muted transition-colors hover:text-kay-fg"
            >
              <IconPlus />
            </button>
          </div>
          <p className="text-[14px] font-semibold text-kay-fg">
            {formatNaira(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </li>
  );
}
