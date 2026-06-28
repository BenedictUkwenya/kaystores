"use client";

import type { Product } from "@/types/product";
import { useCompare } from "@/providers/CompareProvider";
import { IconCompare } from "@/components/ui/Icons";

type CompareButtonProps = {
  product: Product;
  variant?: "primary" | "ghost";
  className?: string;
};

export function CompareButton({
  product,
  variant = "primary",
  className = "",
}: CompareButtonProps) {
  const { startCompareWith, isInCompare, openCompare } = useCompare();
  const active = isInCompare(product.slug);

  function handleClick() {
    if (active) {
      openCompare({ anchorSlug: product.slug });
      return;
    }
    startCompareWith(product);
  }

  const base =
    variant === "primary"
      ? "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-kay-border px-6 text-[14px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
      : "inline-flex items-center gap-1.5 text-[12px] font-medium text-kay-muted transition-colors hover:text-kay-fg";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${base} ${className}`}
    >
      <IconCompare className="h-4 w-4" />
      {active ? "View Compare" : "Compare"}
    </button>
  );
}
