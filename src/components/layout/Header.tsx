"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconBag, IconChevronDown, IconSearch } from "@/components/ui/Icons";
import { HeaderAccountLink } from "@/components/auth/HeaderAccountLink";
import { HeaderPortalLink } from "@/components/auth/HeaderPortalLink";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AfterDarkDiscreetStrip } from "@/components/layout/AfterDarkDiscreetStrip";
import { Logo } from "@/components/brand/Logo";
import { useCart } from "@/providers/CartProvider";
import {
  NAV_DROPDOWN_LINKS,
  NAV_STATIC_LINKS,
} from "@/lib/shop/collections";

const NAV_ITEMS = [
  { label: "Gifts" as const, hasDropdown: true },
  { label: "By Occasion" as const, hasDropdown: true },
  { label: "By Recipient" as const, hasDropdown: true },
  { label: "Luxury Collection" as const, hasDropdown: false },
  { label: "Corporate Gifting" as const, hasDropdown: false },
];

function getNavHref(label: string): string {
  if (label in NAV_STATIC_LINKS) {
    return NAV_STATIC_LINKS[label as keyof typeof NAV_STATIC_LINKS];
  }
  if (label === "Gifts") return "/gifts";
  return "/gifts";
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { itemCount, openCart } = useCart();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <header className="sticky top-0 z-50 bg-kay-bg">
      <div className="relative mx-auto grid h-[60px] max-w-[1440px] grid-cols-[1fr_auto] items-center gap-2 px-4 sm:grid-cols-[1fr_auto_1fr] sm:px-8 lg:px-16 xl:px-20">
        <Logo size="md" className="justify-self-start" />

        <nav
          className="hidden items-center justify-center gap-6 lg:flex lg:justify-self-center"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((link) => {
            const dropdown =
              NAV_DROPDOWN_LINKS[link.label as keyof typeof NAV_DROPDOWN_LINKS];

            if (link.hasDropdown && dropdown) {
              return (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(link.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    href={getNavHref(link.label)}
                    className="flex items-center gap-1 py-2 text-[13px] font-normal text-kay-fg transition-opacity hover:opacity-60"
                  >
                    {link.label}
                    <IconChevronDown className="mt-px opacity-50" />
                  </Link>
                  {openDropdown === link.label && (
                    <div className="absolute left-1/2 top-full z-50 min-w-[180px] -translate-x-1/2 pt-2">
                      <ul className="rounded-xl border border-kay-border bg-kay-surface-elevated py-2 shadow-sm">
                        {dropdown.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className="block px-4 py-2 text-[13px] text-kay-fg transition-colors hover:bg-kay-surface"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.label}
                href={getNavHref(link.label)}
                className="text-[13px] font-normal text-kay-fg transition-opacity hover:opacity-60"
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 items-center justify-self-end gap-0.5 sm:gap-1.5">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <form onSubmit={handleSearch} className="hidden md:flex">
            <label htmlFor="header-search" className="sr-only">
              Search gifts
            </label>
            <input
              id="header-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="h-9 w-28 rounded-full border border-kay-border bg-kay-input-bg px-3 text-[12px] text-kay-fg outline-none placeholder:text-kay-subtle focus:border-kay-fg lg:w-36"
            />
          </form>
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center text-kay-fg transition-opacity hover:opacity-60 md:hidden"
          >
            <IconSearch />
          </Link>
          <HeaderPortalLink className="hidden sm:flex" />
          <HeaderAccountLink />
          <button
            type="button"
            aria-label="Shopping bag"
            onClick={openCart}
            className="relative flex h-10 w-10 items-center justify-center text-kay-fg transition-opacity hover:opacity-60"
          >
            <IconBag />
            {itemCount > 0 && (
              <span className="absolute right-1 top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-kay-accent px-0.5 text-[9px] font-medium leading-none text-kay-accent-fg">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="ml-1 flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span
              className={`block h-px w-5 bg-kay-fg transition-transform ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
            />
            <span
              className={`block h-px w-5 bg-kay-fg transition-opacity ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-px w-5 bg-kay-fg transition-transform ${menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="max-h-[70vh] overflow-y-auto border-t border-kay-border-light bg-kay-bg px-4 py-4 sm:px-8 lg:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="space-y-4">
            <li>
              <Link
                href="/gifts"
                onClick={() => setMenuOpen(false)}
                className="text-[15px] font-medium text-kay-fg"
              >
                All Gifts
              </Link>
            </li>
            {NAV_ITEMS.map((link) => {
              const dropdown =
                NAV_DROPDOWN_LINKS[
                  link.label as keyof typeof NAV_DROPDOWN_LINKS
                ];
              if (dropdown) {
                return (
                  <li key={link.label}>
                    <p className="text-[11px] uppercase tracking-wider text-kay-subtle">
                      {link.label}
                    </p>
                    <ul className="mt-2 space-y-2 pl-2">
                      {dropdown.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className="text-[14px] text-kay-fg"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }
              return (
                <li key={link.label}>
                  <Link
                    href={getNavHref(link.label)}
                    onClick={() => setMenuOpen(false)}
                    className="text-[15px] text-kay-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="sm:hidden">
              <HeaderPortalLink className="flex flex-wrap gap-2 pt-1" />
            </li>
            <li>
              <Link
                href="/search"
                onClick={() => setMenuOpen(false)}
                className="text-[15px] text-kay-fg"
              >
                Search
              </Link>
            </li>
            <li className="flex items-center justify-between border-t border-kay-border-light pt-4">
              <span className="text-[11px] uppercase tracking-wider text-kay-subtle">
                Appearance
              </span>
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      )}
      <AfterDarkDiscreetStrip />
    </header>
  );
}
