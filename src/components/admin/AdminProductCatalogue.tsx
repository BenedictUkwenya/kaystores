"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { formatNaira } from "@/lib/data/home";
import { formatPlacementSummary } from "@/lib/shop/taxonomy";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { AdminProductActions } from "@/components/admin/AdminProductActions";
import { AdminProductTagEditor } from "@/components/admin/AdminProductTagEditor";
import {
  IconPackage,
  IconSearch,
  IconStore,
  IconTag,
} from "@/components/ui/Icons";

export type AdminProductRow = Product & {
  vendorName: string | null;
};

type Props = {
  products: AdminProductRow[];
};

type OwnershipFilter = "all" | "kay" | "vendor";
type StatusFilter = "all" | "live" | "draft" | "out";

export function AdminProductCatalogue({ products }: Props) {
  const [query, setQuery] = useState("");
  const [ownership, setOwnership] = useState<OwnershipFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search) ||
        product.vendorName?.toLowerCase().includes(search);
      const matchesOwnership =
        ownership === "all" ||
        (ownership === "kay" && !product.vendor_id) ||
        (ownership === "vendor" && Boolean(product.vendor_id));
      const matchesStatus =
        status === "all" ||
        (status === "out"
          ? product.stock_quantity <= 0
          : product.status === status);
      return matchesSearch && matchesOwnership && matchesStatus;
    });
  }, [ownership, products, query, status]);

  function resetFilters() {
    setQuery("");
    setOwnership("all");
    setStatus("all");
  }

  const filterButton = (
    value: OwnershipFilter,
    label: string,
  ) => (
    <button
      type="button"
      onClick={() => setOwnership(value)}
      className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
        ownership === value
          ? "border-[#111111] bg-[#111111] text-white"
          : "border-kay-border bg-kay-surface-elevated text-kay-muted hover:border-kay-fg"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-kay-border-light bg-kay-surface-elevated p-4 shadow-[var(--kay-card-shadow)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search products</span>
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-kay-subtle" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, SKU, brand, or vendor…"
              className="h-11 w-full rounded-xl border border-kay-border bg-kay-input-bg pl-10 pr-4 text-[13px] text-kay-fg outline-none placeholder:text-kay-subtle focus:border-kay-gold"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {filterButton("all", "All owners")}
            {filterButton("kay", "Kay")}
            {filterButton("vendor", "Vendors")}
            <span className="mx-1 hidden h-5 w-px bg-kay-border-light sm:block" />
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StatusFilter)
              }
              aria-label="Filter by status"
              className="h-8 rounded-full border border-kay-border bg-kay-surface-elevated px-3 text-[11px] font-medium text-kay-muted outline-none focus:border-kay-gold"
            >
              <option value="all">All statuses</option>
              <option value="live">Live</option>
              <option value="draft">Draft</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-kay-border-light pt-4 text-[12px] text-kay-muted">
          <p>
            Showing{" "}
            <span className="font-semibold text-kay-fg">{filtered.length}</span>{" "}
            of {products.length} products
          </p>
          {(query || ownership !== "all" || status !== "all") && (
            <button
              type="button"
              onClick={resetFilters}
              className="font-medium text-kay-gold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-kay-border bg-kay-surface-elevated px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-kay-surface text-kay-gold">
            <IconSearch className="h-5 w-5" />
          </span>
          <p className="mt-4 font-serif text-[22px] text-kay-fg">
            No products found
          </p>
          <p className="mt-2 text-[13px] text-kay-muted">
            Try another search or remove the active filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 text-[13px] font-medium text-kay-gold hover:underline"
          >
            Show all products
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((product) => {
            const cover = product.images?.[0];
            return (
              <li
                key={product.id}
                className="relative rounded-[24px] border border-kay-border-light bg-kay-surface-elevated p-4 shadow-[var(--kay-card-shadow)] transition-colors hover:border-kay-gold/35 sm:p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface sm:h-24 sm:w-24">
                      {cover ? (
                        <Image
                          src={cover}
                          alt=""
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-kay-subtle">
                          <IconPackage className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="font-serif text-[20px] leading-tight text-kay-fg hover:text-kay-gold"
                        >
                          {product.name}
                        </Link>
                        <StatusBadge status={product.status ?? "live"} />
                      </div>
                      <p className="mt-1 text-[12px] text-kay-muted">
                        {product.brand}{" "}
                        <span className="text-kay-subtle">·</span>{" "}
                        <span className="font-mono">{product.sku}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                        {product.vendor_id ? (
                          <Link
                            href={`/admin/vendors/${product.vendor_id}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-kay-border-light px-2.5 py-1 text-kay-muted hover:border-kay-gold hover:text-kay-gold"
                          >
                            <IconStore className="h-3 w-3" />
                            {product.vendorName ?? "Vendor"}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-kay-gold/30 bg-kay-gold-light/20 px-2.5 py-1 font-medium text-kay-gold">
                            <IconTag className="h-3 w-3" />
                            Kay Stores
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-2.5 py-1 ${
                            product.stock_quantity > 0
                              ? "border-kay-border-light text-kay-muted"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                          }`}
                        >
                          {product.stock_quantity > 0
                            ? `${product.stock_quantity} in stock`
                            : "Out of stock"}
                        </span>
                        <span className="max-w-full truncate rounded-full border border-kay-border-light px-2.5 py-1 text-kay-muted">
                          {formatPlacementSummary(product)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-kay-border-light pt-4 xl:w-[290px] xl:justify-end xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                    <div className="mr-auto xl:mr-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
                        List price
                      </p>
                      <p className="mt-1 font-serif text-[20px] text-kay-fg">
                        {formatNaira(product.price)}
                      </p>
                    </div>
                    <AdminProductTagEditor product={product} />
                    <AdminProductActions
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
