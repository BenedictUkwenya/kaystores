"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { TABLE_CATEGORIES, TABLE_COPY, TABLE_ROUTES } from "@/lib/table/catalog";

export function TableHero() {
  return (
    <section className="table-paper-grain relative min-h-[min(82vh,680px)] overflow-hidden">
      <div className="relative mx-auto flex min-h-[min(82vh,680px)] max-w-[1280px] flex-col justify-center px-4 py-16 lg:px-10 lg:py-20">
        <p
          className="table-animate-fade-up text-[11px] uppercase tracking-[0.26em] text-[var(--table-accent)]"
          style={{ "--table-delay": "60ms" } as CSSProperties}
        >
          {TABLE_COPY.tagline}
        </p>

        <h1
          className="table-animate-fade-up mt-5 max-w-xl font-serif text-[46px] leading-[1.05] tracking-[-0.02em] text-[var(--table-ink)] sm:text-[58px] lg:text-[64px]"
          style={{ "--table-delay": "160ms" } as CSSProperties}
        >
          {TABLE_COPY.heroTitle}
        </h1>

        <p
          className="table-animate-fade-up mt-5 max-w-md text-[15px] leading-relaxed text-[var(--table-muted)] sm:text-[16px]"
          style={{ "--table-delay": "280ms" } as CSSProperties}
        >
          {TABLE_COPY.heroSubtitle}
        </p>

        <div
          className="table-animate-fade-up mt-9 flex flex-wrap gap-3"
          style={{ "--table-delay": "400ms" } as CSSProperties}
        >
          <a
            href="#selections"
            className="table-cta inline-flex h-12 items-center justify-center rounded-full px-9 text-[13px] font-semibold tracking-wide"
          >
            {TABLE_COPY.heroBrowse}
          </a>
          <Link
            href={TABLE_ROUTES.request}
            className="table-cta-secondary inline-flex h-12 items-center justify-center rounded-full px-7 text-[13px] font-semibold tracking-wide"
          >
            {TABLE_COPY.heroRequest}
          </Link>
        </div>

        <nav
          className="table-animate-fade-in mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--table-line)] pt-6"
          style={{ "--table-delay": "520ms" } as CSSProperties}
          aria-label="Kitchen categories"
        >
          {TABLE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/table?tag=${cat.tag}`}
              className="group text-[13px] text-[var(--table-muted)] transition-colors hover:text-[var(--table-ink)]"
            >
              <span className="font-medium text-[var(--table-ink)] group-hover:underline group-hover:underline-offset-4">
                {cat.label}
              </span>
              <span className="ml-1.5 text-[var(--table-subtle)]">
                {cat.blurb}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
