"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Product } from "@/types/product";
import { formatNaira } from "@/lib/data/home";
import { useCompare } from "@/providers/CompareProvider";
import { IconSearch, IconSparkle } from "@/components/ui/Icons";

type ComparePickerProps = {
  anchorSlug: string | null;
  anchorProduct?: Product;
};

type Tab = "search" | "ai";

export function ComparePicker({ anchorSlug, anchorProduct }: ComparePickerProps) {
  const { slugs, canAddMore, addProduct, addProducts, isInCompare } = useCompare();
  const [tab, setTab] = useState<Tab>("ai");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [aiResults, setAiResults] = useState<Product[]>([]);
  const [aiMessage, setAiMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          q: query.trim(),
          exclude: slugs.join(","),
        });
        const res = await fetch(`/api/products/search?${params}`);
        const data = (await res.json()) as { products: Product[] };
        setSearchResults(data.products ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, slugs]);

  useEffect(() => {
    if (!anchorSlug || tab !== "ai") return;

    let cancelled = false;
    async function loadSuggestions() {
      setLoadingAi(true);
      try {
        const res = await fetch("/api/ai/compare-suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: anchorSlug }),
        });
        const data = (await res.json()) as {
          products?: Product[];
          message?: string;
        };
        if (!cancelled) {
          setAiResults(
            (data.products ?? []).filter((p) => !slugs.includes(p.slug)),
          );
          setAiMessage(data.message ?? "");
        }
      } catch {
        if (!cancelled) {
          setAiResults([]);
          setAiMessage("Could not load Kay AI suggestions.");
        }
      } finally {
        if (!cancelled) setLoadingAi(false);
      }
    }

    void loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, [anchorSlug, tab, slugs]);

  if (!canAddMore) {
    return (
      <p className="rounded-2xl border border-kay-border-light bg-kay-surface px-5 py-4 text-center text-[13px] text-kay-muted">
        You&apos;re comparing the maximum of 3 gifts. Remove one to add another.
      </p>
    );
  }

  const results = tab === "search" ? searchResults : aiResults;

  return (
    <div className="compare-picker-card p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
            Build your shortlist
          </p>
          <h3 className="mt-1 font-serif text-[22px] text-kay-fg">
            Add another gift
          </h3>
        </div>

        <div className="flex self-start rounded-full border border-kay-border bg-kay-bg p-1">
          <TabButton active={tab === "ai"} onClick={() => setTab("ai")}>
            <IconSparkle className="mr-1.5 h-3 w-3" />
            Kay AI
          </TabButton>
          <TabButton active={tab === "search"} onClick={() => setTab("search")}>
            <IconSearch className="mr-1.5 h-3.5 w-3.5" />
            Search
          </TabButton>
        </div>
      </div>

      {tab === "search" ? (
        <div className="relative mt-5">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-kay-subtle" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or brand…"
            className="h-12 w-full rounded-full border border-kay-border bg-kay-bg pl-11 pr-5 text-[14px] text-kay-fg outline-none transition-colors placeholder:text-kay-subtle focus:border-kay-fg"
          />
        </div>
      ) : (
        <p className="mt-5 text-[14px] leading-relaxed text-kay-muted">
          {loadingAi
            ? "Kay AI is curating similar gifts…"
            : aiMessage || "Hand-picked alternatives based on this gift."}
        </p>
      )}

      <ul className="mt-5 space-y-2">
        {tab === "search" && !query.trim() && (
          <li className="py-8 text-center text-[13px] text-kay-subtle">
            Start typing to search the catalog
          </li>
        )}

        {searching && tab === "search" && (
          <li className="py-6 text-center text-[13px] text-kay-subtle">
            Searching…
          </li>
        )}

        {!searching &&
          results.map((product) => (
            <PickerRow
              key={product.id}
              product={product}
              disabled={isInCompare(product.slug)}
              onAdd={() => {
                if (anchorProduct && !isInCompare(anchorProduct.slug)) {
                  addProducts([anchorProduct, product]);
                } else {
                  addProduct(product);
                }
              }}
            />
          ))}

        {!searching &&
          !loadingAi &&
          results.length === 0 &&
          ((tab === "search" && query.trim()) || tab === "ai") && (
            <li className="py-6 text-center text-[13px] text-kay-subtle">
              No matching gifts found
            </li>
          )}
      </ul>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center rounded-full px-4 text-[12px] font-medium transition-all ${
        active
          ? "bg-kay-fg text-kay-bg shadow-sm"
          : "text-kay-muted hover:text-kay-fg"
      }`}
    >
      {children}
    </button>
  );
}

function PickerRow({
  product,
  disabled,
  onAdd,
}: {
  product: Product;
  disabled: boolean;
  onAdd: () => void;
}) {
  return (
    <li className="group flex items-center gap-4 rounded-xl border border-kay-border-light bg-kay-bg/60 p-3 transition-colors hover:border-kay-border hover:bg-kay-bg">
      <div className="relative h-[72px] w-14 shrink-0 overflow-hidden rounded-lg bg-kay-surface shadow-sm">
        <Image
          src={product.images[0] ?? "/images/kay-hero-luxury-box.png"}
          alt={product.name}
          fill
          sizes="56px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-gold">
          {product.brand}
        </p>
        <p className="mt-0.5 truncate font-medium text-kay-fg">{product.name}</p>
        <p className="mt-1 font-serif text-[15px] text-kay-gold">
          {formatNaira(product.price)}
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="shrink-0 rounded-full bg-kay-fg px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-kay-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-kay-surface disabled:text-kay-subtle"
      >
        {disabled ? "Added" : "Add"}
      </button>
    </li>
  );
}
