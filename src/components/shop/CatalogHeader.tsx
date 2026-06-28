"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconChevronDown } from "@/components/ui/Icons";

type CatalogHeaderProps = {
  title: string;
  description: string;
  total: number;
  breadcrumbs: { label: string; href: string }[];
  sort: string;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
};

export function CatalogHeader({
  title,
  description,
  total,
  breadcrumbs,
  sort,
  basePath,
  searchParams,
}: CatalogHeaderProps) {
  const router = useRouter();

  function handleSortChange(nextSort: string) {
    const params = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value && key !== "sort" && key !== "page") params.set(key, value);
      });
    }
    if (nextSort !== "newest") params.set("sort", nextSort);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <header className="border-b border-kay-border-light pb-5">
      <nav className="flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-kay-subtle">
        {breadcrumbs.map((crumb, i) => (
          <span key={`${i}-${crumb.label}`} className="flex items-center gap-1">
            {i > 0 && <span className="text-kay-border">/</span>}
            {i === breadcrumbs.length - 1 ? (
              <span className="text-kay-muted">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-kay-fg"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="font-serif text-[28px] leading-[1.15] text-kay-fg sm:text-[32px]">
            {title}
          </h1>
          <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-kay-muted">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:pb-0.5">
          <p className="hidden text-[12px] text-kay-subtle sm:block">
            {total.toLocaleString()} {total === 1 ? "gift" : "gifts"}
          </p>
          <div className="relative">
            <label htmlFor="sort" className="sr-only">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-9 appearance-none rounded-full border border-kay-border bg-kay-input-bg py-0 pl-3.5 pr-9 text-[12px] text-kay-fg outline-none transition-colors focus:border-kay-fg"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A–Z</option>
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-40" />
          </div>
        </div>
      </div>

      <p className="mt-2 text-[12px] text-kay-subtle sm:hidden">
        {total.toLocaleString()} {total === 1 ? "gift" : "gifts"}
      </p>
    </header>
  );
}
