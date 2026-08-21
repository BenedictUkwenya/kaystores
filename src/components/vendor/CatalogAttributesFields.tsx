"use client";

import {
  FOOTWEAR_SIZES,
  CLOTHING_SIZES,
  MASTER_CATEGORIES,
  PRODUCT_AUDIENCES,
  PRODUCT_COLORS,
  PRODUCT_CONDITIONS,
  PRODUCT_TYPES,
  SPECS_BY_MASTER,
  TYPES_BY_MASTER,
} from "@/lib/products/catalog-attributes";

export type CatalogAttributeValues = {
  productType: string;
  masterCategory: string;
  color: string;
  condition: string;
  audience: string;
  specs: Record<string, string>;
  sizeOptions: string[];
};

type Props = {
  value: CatalogAttributeValues;
  onChange: (next: CatalogAttributeValues) => void;
};

const selectClass =
  "h-11 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[13px] text-kay-fg outline-none focus:border-kay-fg";

export function CatalogAttributesFields({ value, onChange }: Props) {
  const typeOptions =
    value.masterCategory && TYPES_BY_MASTER[value.masterCategory]
      ? TYPES_BY_MASTER[value.masterCategory]
      : PRODUCT_TYPES;
  const specFields = value.masterCategory
    ? SPECS_BY_MASTER[value.masterCategory] ?? []
    : [];
  const sizePool =
    value.masterCategory === "Footwear"
      ? FOOTWEAR_SIZES
      : value.masterCategory === "Other"
        ? [...FOOTWEAR_SIZES, ...CLOTHING_SIZES]
        : CLOTHING_SIZES;
  const showSizes =
    value.masterCategory === "Footwear" ||
    ["Sneaker", "Slide", "Sandal", "Loafer", "Boot"].includes(value.productType);

  function patch(partial: Partial<CatalogAttributeValues>) {
    onChange({ ...value, ...partial });
  }

  function toggleSize(size: string) {
    const has = value.sizeOptions.includes(size);
    patch({
      sizeOptions: has
        ? value.sizeOptions.filter((s) => s !== size)
        : [...value.sizeOptions, size],
    });
  }

  return (
    <div className="space-y-5 border-t border-kay-border-light pt-5">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
          Searchable tags
        </p>
        <p className="mb-4 text-[12px] text-kay-muted">
          Fixed categories so shoppers can find this gift by type — e.g. “shoe”
          still surfaces slides and sneakers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
            Master category
          </label>
          <select
            className={selectClass}
            value={value.masterCategory}
            onChange={(e) => {
              const masterCategory = e.target.value;
              const allowed = TYPES_BY_MASTER[masterCategory] ?? PRODUCT_TYPES;
              const productType = allowed.includes(value.productType)
                ? value.productType
                : "";
              patch({
                masterCategory,
                productType,
                specs: {},
                sizeOptions:
                  masterCategory === "Footwear" ? value.sizeOptions : [],
              });
            }}
            required
          >
            <option value="">Select…</option>
            {MASTER_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
            Type
          </label>
          <select
            className={selectClass}
            value={value.productType}
            onChange={(e) => patch({ productType: e.target.value })}
            required
          >
            <option value="">Select…</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
            Color
          </label>
          <select
            className={selectClass}
            value={value.color}
            onChange={(e) => patch({ color: e.target.value })}
            required
          >
            <option value="">Select…</option>
            {PRODUCT_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
            Condition
          </label>
          <select
            className={selectClass}
            value={value.condition}
            onChange={(e) => patch({ condition: e.target.value })}
            required
          >
            <option value="">Select…</option>
            {PRODUCT_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
            Audience
          </label>
          <select
            className={selectClass}
            value={value.audience}
            onChange={(e) => patch({ audience: e.target.value })}
            required
          >
            <option value="">Select…</option>
            {PRODUCT_AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {specFields.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {specFields.map((field) => (
            <div key={field.key}>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
                {field.key}
              </label>
              <select
                className={selectClass}
                value={value.specs[field.key] ?? ""}
                onChange={(e) =>
                  patch({
                    specs: { ...value.specs, [field.key]: e.target.value },
                  })
                }
              >
                <option value="">Select…</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {showSizes && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
            Available sizes
          </p>
          <p className="mb-3 text-[12px] text-kay-muted">
            Shoppers pick one size on the product page. Leave empty if this item
            has no size.
          </p>
          <div className="flex flex-wrap gap-2">
            {sizePool.map((size) => {
              const active = value.sizeOptions.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`min-w-11 rounded-lg border px-3 py-2 text-[13px] ${
                    active
                      ? "border-kay-gold bg-kay-gold-light/40 text-kay-fg"
                      : "border-kay-border text-kay-muted hover:border-kay-gold/40"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
