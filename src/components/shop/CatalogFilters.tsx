"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OCCASIONS, RECIPIENTS } from "@/lib/shop/collections";
import { IconChevronDown } from "@/components/ui/Icons";

type CatalogFiltersProps = {
  basePath: string;
  brands: string[];
  searchParams: Record<string, string | undefined>;
  showOccasions?: boolean;
  showRecipients?: boolean;
};

const PRICE_PRESETS = [
  { label: "All prices", min: 0, max: 500000 },
  { label: "Under ₦50k", min: 0, max: 50000 },
  { label: "₦50k – ₦150k", min: 50000, max: 150000 },
  { label: "₦150k – ₦300k", min: 150000, max: 300000 },
  { label: "₦300k+", min: 300000, max: 500000 },
] as const;

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-kay-border-light py-5 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="font-serif text-[15px] text-kay-fg">{title}</span>
        <IconChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-kay-subtle transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-3.5">{children}</div>}
    </div>
  );
}

function FilterPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-[12px] leading-none transition-all duration-200 ${
        selected
          ? "border-kay-fg bg-kay-fg text-kay-accent-fg"
          : "border-kay-border bg-transparent text-kay-muted hover:border-kay-fg/40 hover:text-kay-fg"
      }`}
    >
      {label}
    </button>
  );
}

export function CatalogFilters({
  basePath,
  brands,
  searchParams,
  showOccasions = true,
  showRecipients = true,
}: CatalogFiltersProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.brand?.split(",").filter(Boolean) ?? [],
  );
  const [minPrice, setMinPrice] = useState(searchParams.minPrice ?? "0");
  const [maxPrice, setMaxPrice] = useState(
    searchParams.maxPrice ?? "500000",
  );
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    searchParams.occasion?.split(",").filter(Boolean) ?? [],
  );
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(
    searchParams.recipient?.split(",").filter(Boolean) ?? [],
  );

  useEffect(() => {
    setSelectedBrands(searchParams.brand?.split(",").filter(Boolean) ?? []);
    setMinPrice(searchParams.minPrice ?? "0");
    setMaxPrice(searchParams.maxPrice ?? "500000");
    setSelectedOccasions(
      searchParams.occasion?.split(",").filter(Boolean) ?? [],
    );
    setSelectedRecipients(
      searchParams.recipient?.split(",").filter(Boolean) ?? [],
    );
  }, [searchParams]);

  const activeCount =
    selectedBrands.length +
    selectedOccasions.length +
    selectedRecipients.length +
    (minPrice !== "0" || maxPrice !== "500000" ? 1 : 0);

  function pushFilters(state: {
    brands: string[];
    minPrice: string;
    maxPrice: string;
    occasions: string[];
    recipients: string[];
  }) {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.sort) params.set("sort", searchParams.sort);
    if (state.brands.length) params.set("brand", state.brands.join(","));
    if (state.minPrice !== "0") params.set("minPrice", state.minPrice);
    if (state.maxPrice !== "500000") params.set("maxPrice", state.maxPrice);
    if (state.occasions.length)
      params.set("occasion", state.occasions.join(","));
    if (state.recipients.length)
      params.set("recipient", state.recipients.join(","));
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function toggleItem(
    list: string[],
    item: string,
    setter: (v: string[]) => void,
    key: "brands" | "occasions" | "recipients",
  ) {
    const next = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
    setter(next);
    pushFilters({
      brands: key === "brands" ? next : selectedBrands,
      minPrice,
      maxPrice,
      occasions: key === "occasions" ? next : selectedOccasions,
      recipients: key === "recipients" ? next : selectedRecipients,
    });
  }

  function selectPricePreset(min: number, max: number) {
    const nextMin = String(min);
    const nextMax = String(max);
    setMinPrice(nextMin);
    setMaxPrice(nextMax);
    pushFilters({
      brands: selectedBrands,
      minPrice: nextMin,
      maxPrice: nextMax,
      occasions: selectedOccasions,
      recipients: selectedRecipients,
    });
  }

  function resetFilters() {
    setSelectedBrands([]);
    setMinPrice("0");
    setMaxPrice("500000");
    setSelectedOccasions([]);
    setSelectedRecipients([]);
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.sort) params.set("sort", searchParams.sort);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function isPricePresetActive(min: number, max: number) {
    return Number(minPrice) === min && Number(maxPrice) === max;
  }

  const filterContent = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-kay-gold">
          Refine
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] text-kay-subtle underline-offset-2 transition-colors hover:text-kay-fg hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {brands.length > 0 && (
        <FilterSection title="Brand">
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <FilterPill
                key={brand}
                label={brand}
                selected={selectedBrands.includes(brand)}
                onClick={() =>
                  toggleItem(selectedBrands, brand, setSelectedBrands, "brands")
                }
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Price">
        <div className="flex flex-col gap-1.5">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => selectPricePreset(preset.min, preset.max)}
              className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors ${
                isPricePresetActive(preset.min, preset.max)
                  ? "bg-kay-surface font-medium text-kay-fg"
                  : "text-kay-muted hover:bg-kay-surface/60 hover:text-kay-fg"
              }`}
            >
              <span
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                  isPricePresetActive(preset.min, preset.max)
                    ? "border-kay-fg bg-kay-fg"
                    : "border-kay-border"
                }`}
              >
                {isPricePresetActive(preset.min, preset.max) && (
                  <span className="h-1 w-1 rounded-full bg-kay-accent-fg" />
                )}
              </span>
              {preset.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {showOccasions && (
        <FilterSection title="Occasion">
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <FilterPill
                key={o.slug}
                label={o.label}
                selected={selectedOccasions.includes(o.slug)}
                onClick={() =>
                  toggleItem(
                    selectedOccasions,
                    o.slug,
                    setSelectedOccasions,
                    "occasions",
                  )
                }
              />
            ))}
          </div>
        </FilterSection>
      )}

      {showRecipients && (
        <FilterSection title="Recipient">
          <div className="flex flex-wrap gap-2">
            {RECIPIENTS.map((r) => (
              <FilterPill
                key={r.slug}
                label={r.label}
                selected={selectedRecipients.includes(r.slug)}
                onClick={() =>
                  toggleItem(
                    selectedRecipients,
                    r.slug,
                    setSelectedRecipients,
                    "recipients",
                  )
                }
              />
            ))}
          </div>
        </FilterSection>
      )}
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="mb-4 flex w-full items-center justify-between rounded-lg border border-kay-border bg-kay-surface-elevated px-4 py-3 text-[13px] text-kay-fg lg:hidden"
        aria-expanded={mobileOpen}
      >
        <span>
          Refine
          {activeCount > 0 && (
            <span className="ml-2 text-kay-gold">({activeCount})</span>
          )}
        </span>
        <IconChevronDown
          className={`h-4 w-4 text-kay-subtle transition-transform ${mobileOpen ? "rotate-180" : ""}`}
        />
      </button>

      <aside
        className={`lg:sticky lg:top-[72px] lg:block lg:self-start ${
          mobileOpen ? "block" : "hidden"
        }`}
      >
        <div className="rounded-lg border border-kay-border-light bg-kay-surface-elevated/50 px-4 py-4 backdrop-blur-sm lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
          {filterContent}
        </div>
      </aside>
    </>
  );
}
