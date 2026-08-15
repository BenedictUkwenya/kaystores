"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AFTER_DARK_NAV,
  AFTER_DARK_ROUTES,
} from "@/lib/after-dark/catalog";
import { useCart } from "@/providers/CartProvider";
import { HeaderAccountLink } from "@/components/auth/HeaderAccountLink";
import { HeaderPortalLink } from "@/components/auth/HeaderPortalLink";
import { Logo } from "@/components/brand/Logo";
import { IconBag, IconSearch, IconX } from "@/components/ui/Icons";

export function AfterDarkHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { itemCount, openCart } = useCart();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    const params = new URLSearchParams({ collection: "after-dark" });
    if (q) params.set("q", q);
    router.push(`/search?${params.toString()}`);
    setSearchOpen(false);
    setMenuOpen(false);
  }

  return (
    <header className="ad-header-glow sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between gap-2 px-4 sm:px-6 lg:px-10">
        <Logo
          href={AFTER_DARK_ROUTES.home}
          variant="dark"
          size="md"
          label="Kay After Dark — Home"
          tagline="After Dark"
          className="min-w-0"
        />

        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label="After Dark navigation"
        >
          {AFTER_DARK_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[13px] text-white/75 transition-colors hover:text-ad-amber"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <div className="relative flex items-center">
            {searchOpen ? (
              <form
                onSubmit={handleSearch}
                className="flex items-center overflow-hidden rounded-full border border-white/15 bg-white/5 focus-within:border-ad-amber/60"
              >
                <label htmlFor="after-dark-search" className="sr-only">
                  Search After Dark
                </label>
                <input
                  id="after-dark-search"
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
                  placeholder="Search After Dark…"
                  className="h-9 w-[min(42vw,11rem)] bg-transparent pl-3.5 pr-1 text-[12px] text-white outline-none placeholder:text-white/40 sm:w-40"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-ad-amber transition-opacity hover:opacity-80"
                >
                  <IconSearch className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                aria-label="Search After Dark"
                onClick={() => setSearchOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:text-ad-amber"
              >
                <IconSearch className="h-4 w-4" />
              </button>
            )}
          </div>
          <HeaderPortalLink variant="dark" className="hidden sm:flex" />
          <HeaderAccountLink variant="dark" />
          <button
            type="button"
            onClick={openCart}
            aria-label="Open bag"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:text-ad-amber"
          >
            <IconBag className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ad-amber px-1 text-[9px] font-bold text-black">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:text-ad-amber lg:hidden"
          >
            {menuOpen ? <IconX className="h-5 w-5" /> : <span className="text-lg">☰</span>}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="max-h-[70vh] overflow-y-auto border-t border-white/10 px-4 py-4 sm:px-6 lg:hidden">
          <ul className="space-y-3">
            {AFTER_DARK_NAV.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-1 text-[14px] text-white/80"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="block py-1 text-left text-[14px] text-white/80"
              >
                Search
              </button>
            </li>
            <li className="border-t border-white/10 pt-3">
              <HeaderPortalLink variant="dark" className="flex flex-wrap gap-2" />
            </li>
            <li>
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="block py-1 text-[14px] text-white/50"
              >
                Return to Kay Stores
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
