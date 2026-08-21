export type ProductVariationOption = {
  id: string;
  label: string;
  stock: number;
};

export type ProductVariation = {
  /** Vendor-defined axis name, e.g. Size, Length, Storage */
  label: string;
  options: ProductVariationOption[];
};

export function emptyVariation(): ProductVariation {
  return { label: "Size", options: [] };
}

export function normalizeVariation(
  value: unknown,
  fallbackSizes?: string[],
  fallbackStock = 0,
): ProductVariation | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    const label = String(row.label ?? "").trim() || "Size";
    const optionsRaw = Array.isArray(row.options) ? row.options : [];
    const options = optionsRaw
      .map((opt, index) => {
        if (!opt || typeof opt !== "object") return null;
        const o = opt as Record<string, unknown>;
        const optLabel = String(o.label ?? "").trim();
        if (!optLabel) return null;
        const id =
          String(o.id ?? "").trim() ||
          slugOptionId(optLabel) ||
          `opt-${index + 1}`;
        return {
          id,
          label: optLabel,
          stock: Math.max(0, Math.floor(Number(o.stock) || 0)),
        } satisfies ProductVariationOption;
      })
      .filter((o): o is ProductVariationOption => o != null);

    if (options.length === 0) return null;
    return { label, options };
  }

  if (fallbackSizes?.length) {
    return {
      label: "Size",
      options: fallbackSizes.map((label) => ({
        id: slugOptionId(label),
        label,
        stock: Math.max(0, Math.floor(fallbackStock)),
      })),
    };
  }

  return null;
}

export function slugOptionId(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "option";
}

export function variationTotalStock(variation: ProductVariation | null | undefined) {
  if (!variation?.options.length) return null;
  return variation.options.reduce((sum, opt) => sum + Math.max(0, opt.stock), 0);
}

export function findVariationOption(
  variation: ProductVariation | null | undefined,
  optionId?: string | null,
) {
  if (!variation || !optionId) return null;
  return variation.options.find((o) => o.id === optionId) ?? null;
}
