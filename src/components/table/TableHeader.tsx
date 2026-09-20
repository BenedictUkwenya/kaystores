"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TABLE_COPY, TABLE_NAV, TABLE_ROUTES } from "@/lib/table/catalog";
import { useCart } from "@/providers/CartProvider";
import { HeaderAccountLink } from "@/components/auth/HeaderAccountLink";
import { HeaderPortalLink } from "@/components/auth/HeaderPortalLink";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconBag, IconSearch, IconX } from "@/components/ui/Icons";

export function TableHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { itemCount, openCart } = useCart();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    const params = new URLSearchParams({ collection: "table" });
    if (q) params.set("q", q);
    router.push(`/search?${params.toString()}`);
    setSearchOpen(false);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--table-line)] bg-[color-mix(in_srgb,var(--table-paper)_92%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between gap-2 px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 items-baseline">
            <Logo
              href={TABLE_ROUTES.home}
              size="md"
              label={`${TABLE_COPY.brand} — Home`}
            />
            <span
              className="ml-2.5 hidden border-l border-[var(--table-line)] pl-2.5 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--table-muted)] sm:inline"
              aria-hidden
            >
              Kitchen
            </span>
          </div>
          <Link
            href="/"
            className="hidden text-[12px] text-[var(--table-muted)] transition-colors hover:text-[var(--table-ink)] md:inline"
          >
            ← Kay Stores
          </Link>
        </div>

        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label="Kay Kitchen navigation"
        >
          {TABLE_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[13px] text-[var(--table-muted)] transition-colors hover:text-[var(--table-ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <div className="relative flex items-center">
            {searchOpen ? (
              <form
                onSubmit={handleSearch}
                className="flex items-center overflow-hidden rounded-full border border-[var(--table-line)] bg-[var(--table-paper)] focus-within:border-[var(--table-ink)]"
              >
                <label htmlFor="table-search" className="sr-only">
                  Search Kay Kitchen
                </label>
                <input
                  id="table-search"
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  onBlur={() => {
                    if (!searchQuery.trim()) setSearchOpen(false);
                  }}
                  placeholder="Search…"
                  className="h-9 w-[min(42vw,11rem)] bg-transparent pl-3.5 pr-1 text-[12px] text-[var(--table-ink)] outline-none placeholder:text-[var(--table-subtle)] sm:w-40"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-[var(--table-ink)] transition-opacity hover:opacity-70"
                >
                  <IconSearch className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                aria-label="Search Kay Kitchen"
                onClick={() => setSearchOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--table-muted)] transition-colors hover:text-[var(--table-ink)]"
              >
                <IconSearch className="h-4 w-4" />
              </button>
            )}
          </div>
          <ThemeToggle className="hidden sm:flex" />
          <HeaderPortalLink className="hidden sm:flex" />
          <HeaderAccountLink />
          <button
            type="button"
            onClick={openCart}
            aria-label="Open bag"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--table-muted)] transition-colors hover:text-[var(--table-ink)]"
          >
            <IconBag className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--table-ink)] px-1 text-[9px] font-bold text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--table-muted)] transition-colors hover:text-[var(--table-ink)] lg:hidden"
          >
            {menuOpen ? (
              <IconX className="h-5 w-5" />
            ) : (
              <span className="text-lg">☰</span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="max-h-[70vh] overflow-y-auto border-t border-[var(--table-line)] bg-[var(--table-paper)] px-4 py-4 sm:px-6 lg:hidden">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--table-line)] pb-4">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="text-[14px] font-medium text-[var(--table-ink)]"
            >
              ← Kay Stores
            </Link>
            <ThemeToggle />
          </div>
          <ul className="space-y-3">
            {TABLE_NAV.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-1 text-[14px] text-[var(--table-ink)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-[var(--table-line)] pt-3">
              <HeaderPortalLink className="flex flex-wrap gap-2" />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
