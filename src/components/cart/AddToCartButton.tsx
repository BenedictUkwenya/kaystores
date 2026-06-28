"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/CartProvider";
import { IconBag, IconHeart } from "@/components/ui/Icons";

const interactive =
  "cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kay-gold focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100";

type AddToCartButtonProps = {
  product: Product;
  variant?: "primary" | "outline";
  className?: string;
  children?: React.ReactNode;
};

export function AddToCartButton({
  product,
  variant = "primary",
  className = "",
  children,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const base =
    variant === "primary"
      ? "bg-kay-accent text-kay-accent-fg shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:brightness-110 disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
      : "border-2 border-kay-fg text-kay-fg hover:bg-kay-fg hover:text-kay-accent-fg hover:-translate-y-0.5 hover:shadow-md disabled:hover:bg-transparent disabled:hover:text-kay-fg";

  function handleClick() {
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      type="button"
      disabled={!product.in_stock}
      onClick={handleClick}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 text-[14px] font-medium disabled:opacity-50 ${interactive} ${base} ${added ? "ring-2 ring-kay-gold ring-offset-2" : ""} ${className}`}
    >
      {added ? (
        <>Added to bag</>
      ) : (
        children ?? (
          <>
            <IconBag className="h-4 w-4" />
            Add to Cart
          </>
        )
      )}
    </button>
  );
}

export function BuyNowButton({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const { addItem } = useCart();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={!product.in_stock}
      onClick={() => {
        addItem(product, 1, { openDrawer: false });
        router.push("/checkout");
      }}
      className={`h-12 w-full rounded-full border-2 border-kay-fg text-[14px] font-medium text-kay-fg shadow-sm hover:-translate-y-0.5 hover:bg-kay-fg hover:text-kay-accent-fg hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-transparent disabled:hover:text-kay-fg disabled:hover:shadow-sm sm:w-auto sm:min-w-[200px] sm:px-8 ${interactive} ${className}`}
    >
      Buy Now
    </button>
  );
}

export function WishlistButton({ className = "" }: { className?: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      aria-label={saved ? "Saved to wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      onClick={() => setSaved((v) => !v)}
      className={`group flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-kay-border bg-kay-bg text-kay-fg shadow-sm hover:-translate-y-0.5 hover:border-kay-fg hover:bg-kay-surface hover:shadow-md ${interactive} ${saved ? "border-kay-gold bg-kay-beta-bg text-kay-gold" : ""} ${className}`}
    >
      <IconHeart
        className={`transition-transform duration-200 group-hover:scale-110 ${saved ? "scale-110" : ""}`}
      />
    </button>
  );
}
