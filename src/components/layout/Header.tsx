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
  { label: "Gifts" as const, short: "Gifts", hasDropdown: true, priority: 1 },
  {
    label: "By Occasion" as const,
    short: "Occasion",
    hasDropdown: true,
    priority: 1,
  },
  {
    label: "By Recipient" as const,
    short: "Recipient",
    hasDropdown: true,
    priority: 1,
  },
  {
    label: "Luxury Collection" as const,
    short: "Luxury",
    hasDropdown: false,
    priority: 2,
  },
  {
    label: "Corporate Gifting" as const,
    short: "Corporate",
    hasDropdown: false,
    priority: 2,
  },
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { itemCount, openCart } = useCart();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-kay-border-light/80 bg-kay-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:h-[60px] sm:gap-4 sm:px-6 lg:px-10 xl:px-14">
        <Logo size="md" className="shrink-0" />

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-x-5 xl:gap-x-7 2xl:gap-x-8 lg:flex"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((link) => {
            const dropdown =
              NAV_DROPDOWN_LINKS[link.label as keyof typeof NAV_DROPDOWN_LINKS];
            const showClass =
              link.priority > 1 ? "hidden xl:flex" : "flex";

            if (link.hasDropdown && dropdown) {
              return (
                <div
                  key={link.label}
                  className={`relative ${showClass}`}
                  onMouseEnter={() => setOpenDropdown(link.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    href={getNavHref(link.label)}
                    className="inline-flex items-center gap-1 whitespace-nowrap py-2 text-[12px] tracking-[0.02em] text-kay-fg transition-opacity hover:opacity-55 xl:text-[13px]"
                  >
                    <span className="xl:hidden">{link.short}</span>
                    <span className="hidden xl:inline">{link.label}</span>
                    <IconChevronDown className="mt-px opacity-45" />
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
                className={`${showClass} items-center whitespace-nowrap text-[12px] tracking-[0.02em] text-kay-fg transition-opacity hover:opacity-55 xl:text-[13px]`}
              >
                <span className="xl:hidden">{link.short}</span>
                <span className="hidden xl:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="relative hidden items-center md:flex">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <label htmlFor="header-search" className="sr-only">
                  Search gifts
                </label>
                <input
                  id="header-search"
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    if (!searchQuery.trim()) setSearchOpen(false);
                  }}
                  placeholder="Search…"
                  className="h-9 w-40 rounded-full border border-kay-border bg-kay-input-bg px-3.5 text-[12px] text-kay-fg outline-none placeholder:text-kay-subtle focus:border-kay-fg lg:w-48"
                />
              </form>
            ) : (
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="flex h-9 w-9 items-center justify-center text-kay-fg transition-opacity hover:opacity-55"
              >
                <IconSearch />
              </button>
            )}
          </div>

          <Link
            href="/search"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center text-kay-fg transition-opacity hover:opacity-55 md:hidden"
          >
            <IconSearch />
          </Link>

          <div className="mx-0.5 hidden h-4 w-px bg-kay-border sm:block" aria-hidden />

          <ThemeToggle className="hidden sm:flex" />
          <HeaderPortalLink className="hidden sm:flex" />
          <HeaderAccountLink />
          <button
            type="button"
            aria-label="Shopping bag"
            onClick={openCart}
            className="relative flex h-9 w-9 items-center justify-center text-kay-fg transition-opacity hover:opacity-55"
          >
            <IconBag />
            {itemCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-kay-accent px-0.5 text-[9px] font-medium leading-none text-kay-accent-fg">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 lg:hidden"
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
