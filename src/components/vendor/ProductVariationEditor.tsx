"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  emptyVariation,
  slugOptionId,
  type ProductVariation,
  type ProductVariationOption,
} from "@/lib/products/variations";

type Props = {
  value: ProductVariation | null;
  onChange: (next: ProductVariation | null) => void;
};

export function ProductVariationEditor({ value, onChange }: Props) {
  const active = value ?? emptyVariation();
  const enabled = value != null && value.options.length >= 0 && value !== null
    ? true
    : Boolean(value);

  function enable() {
    onChange({
      label: "Size",
      options: [{ id: "eu-40", label: "EU 40", stock: 1 }],
    });
  }

  function disable() {
    onChange(null);
  }

  function patch(partial: Partial<ProductVariation>) {
    onChange({ ...active, ...partial });
  }

  function updateOption(index: number, partial: Partial<ProductVariationOption>) {
    const options = active.options.map((opt, i) => {
      if (i !== index) return opt;
      const label = partial.label ?? opt.label;
      return {
        ...opt,
        ...partial,
        label,
        id: partial.id ?? (partial.label ? slugOptionId(label) : opt.id),
      };
    });
    patch({ options });
  }

  function addOption() {
    const n = active.options.length + 1;
    patch({
      options: [
        ...active.options,
        { id: `option-${n}`, label: "", stock: 1 },
      ],
    });
  }

  function removeOption(index: number) {
    const options = active.options.filter((_, i) => i !== index);
    onChange(options.length ? { ...active, options } : null);
  }

  if (!value) {
    return (
      <div className="rounded-xl border border-dashed border-kay-border px-4 py-4">
        <p className="text-[13px] font-medium text-kay-fg">Product variations</p>
        <p className="mt-1 text-[12px] text-kay-muted">
          Optional. Add Size, Length, Storage, or any custom options for this one
          listing — shoppers pick a chip on the product page.
        </p>
        <Button type="button" variant="outline" className="mt-3" onClick={enable}>
          Add variations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-kay-border-light bg-kay-surface/40 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
            Variations
          </p>
          <p className="mt-1 text-[12px] text-kay-muted">
            One group per product (e.g. Size or Length). Set stock per option —
            sold-out options show crossed out for shoppers.
          </p>
        </div>
        <button
          type="button"
          onClick={disable}
          className="text-[12px] text-kay-subtle underline-offset-2 hover:text-kay-fg hover:underline"
        >
          Remove variations
        </button>
      </div>

      <Input
        label="Variation name"
        value={active.label}
        onChange={(e) => patch({ label: e.target.value })}
        placeholder="Size, Length, Storage…"
        required
      />

      <div className="space-y-3">
        {active.options.map((opt, index) => (
          <div
            key={`${opt.id}-${index}`}
            className="grid gap-3 rounded-lg border border-kay-border-light bg-kay-surface-elevated p-3 sm:grid-cols-[1fr_120px_auto]"
          >
            <Input
              label={index === 0 ? "Option label" : ""}
              value={opt.label}
              onChange={(e) => updateOption(index, { label: e.target.value })}
              placeholder="EU 41, 128GB, 90cm…"
              required
            />
            <Input
              label={index === 0 ? "Stock" : ""}
              type="number"
              min={0}
              value={String(opt.stock)}
              onChange={(e) =>
                updateOption(index, {
                  stock: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                })
              }
              required
            />
            <div className={index === 0 ? "flex items-end pb-0.5" : "flex items-center"}>
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="h-11 px-3 text-[12px] text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addOption}>
        Add option
      </Button>
    </div>
  );
}
