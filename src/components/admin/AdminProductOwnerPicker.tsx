"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Vendor } from "@/types/dashboard";
import {
  IconAfterDark,
  IconArrowRight,
  IconDiamond,
  IconPackage,
  IconSearch,
  IconStore,
} from "@/components/ui/Icons";

type Props = {
  vendors: Vendor[];
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AdminProductOwnerPicker({ vendors }: Props) {
  const [query, setQuery] = useState("");
  const filteredVendors = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return vendors;
    return vendors.filter(
      (vendor) =>
        vendor.businessName.toLowerCase().includes(search) ||
        vendor.contactName.toLowerCase().includes(search) ||
        vendor.contactEmail.toLowerCase().includes(search),
    );
  }, [query, vendors]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] bg-[#111111] p-6 text-white shadow-[0_24px_60px_rgba(17,17,17,0.16)] sm:p-8">
        <div
          className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full border border-kay-gold/20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full bg-kay-gold/10 blur-2xl"
          aria-hidden
        />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_260px] lg:items-end">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-kay-gold">
              <IconDiamond className="h-5 w-5" />
            </span>
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-kay-gold">
              First-party catalogue
            </p>
            <h2 className="mt-2 max-w-lg font-serif text-[30px] leading-[1.08] sm:text-[36px]">
              Add a product owned and fulfilled by Kay.
            </h2>
            <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-white/60 sm:text-[14px]">
              Best for Kay inventory. Revenue stays with Kay, stock is managed
              internally, and no vendor earnings or payout record is created.
            </p>
          </div>
          <div>
            <div className="mb-4 grid grid-cols-2 gap-2 text-[11px] text-white/65">
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                Kay inventory
              </span>
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                No payout
              </span>
            </div>
            <Link
              href="/admin/products/new?owner=kay"
              className="flex h-12 w-full items-center justify-between rounded-full bg-kay-gold px-5 text-[13px] font-semibold text-[#111111] transition-transform hover:-translate-y-0.5"
            >
              Create Kay product
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
        <div className="border-b border-kay-border-light px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
                Partner catalogue
              </p>
              <h2 className="mt-1 font-serif text-[26px] leading-tight text-kay-fg">
                Or list for a vendor
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-kay-muted">
                The vendor owns the stock and receives earnings after hub QC.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-kay-border-light bg-kay-surface px-3 py-1.5 text-[11px] font-medium text-kay-muted">
              {vendors.length} approved partner
              {vendors.length === 1 ? "" : "s"}
            </span>
          </div>

          {vendors.length > 4 && (
            <label className="relative mt-5 block">
              <span className="sr-only">Search approved vendors</span>
              <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-kay-subtle" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by business, contact, or email"
                className="h-11 w-full rounded-xl border border-kay-border bg-kay-input-bg pl-10 pr-4 text-[13px] text-kay-fg outline-none transition-colors placeholder:text-kay-subtle focus:border-kay-gold"
              />
            </label>
          )}
        </div>

        {vendors.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-kay-surface text-kay-gold">
              <IconStore className="h-5 w-5" />
            </span>
            <p className="mt-4 font-serif text-[22px] text-kay-fg">
              No approved vendors yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-kay-muted">
              Invite a curated partner, or create this item as Kay inventory.
            </p>
            <Link
              href="/admin/vendors/invites"
              className="mt-5 inline-flex text-[13px] font-medium text-kay-gold hover:underline"
            >
              Invite a vendor →
            </Link>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-kay-muted">
            No approved vendor matches “{query}”.
          </div>
        ) : (
          <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            {filteredVendors.map((vendor) => (
              <li key={vendor.id}>
                <Link
                  href={`/admin/products/new?vendorId=${vendor.id}`}
                  className="group flex h-full items-start gap-3 rounded-2xl border border-kay-border-light bg-kay-bg/35 p-4 transition-all hover:-translate-y-0.5 hover:border-kay-gold/50 hover:bg-kay-gold-light/10 hover:shadow-[var(--kay-card-shadow)]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-[12px] font-semibold tracking-[0.08em] text-kay-gold">
                    {initials(vendor.businessName) || "V"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-kay-fg">
                      {vendor.businessName}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-kay-subtle">
                      {vendor.contactEmail}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-kay-border-light px-2 py-0.5 text-[10px] text-kay-muted">
                        <IconPackage className="h-3 w-3" />
                        Vendor stock
                      </span>
                      {vendor.canListAfterDark && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-kay-gold/25 bg-kay-gold-light/20 px-2 py-0.5 text-[10px] text-kay-gold">
                          <IconAfterDark className="h-3 w-3" />
                          After Dark
                        </span>
                      )}
                    </span>
                  </span>
                  <IconArrowRight className="mt-1 h-4 w-4 shrink-0 text-kay-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-kay-gold" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-[12px] leading-relaxed text-kay-subtle">
        Need to add many vendor SKUs?{" "}
        <Link
          href="/admin/products/import"
          className="font-medium text-kay-gold hover:underline"
        >
          Use catalogue import instead.
        </Link>
      </p>
    </div>
  );
}
