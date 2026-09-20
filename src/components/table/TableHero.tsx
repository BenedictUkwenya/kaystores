"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { TABLE_COPY, TABLE_ROUTES } from "@/lib/table/catalog";

export function TableHero() {
  return (
    <section className="table-paper-grain relative min-h-[min(88vh,720px)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234a2f24' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute -right-16 top-1/4 h-72 w-72 rounded-full bg-[var(--table-berry)]/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[var(--table-leaf)]/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[min(88vh,720px)] max-w-[1280px] flex-col justify-center px-4 py-20 lg:px-10">
        <p
          className="table-animate-fade-up text-[11px] uppercase tracking-[0.28em] text-[var(--table-berry)]"
          style={{ "--table-delay": "80ms" } as CSSProperties}
        >
          {TABLE_COPY.tagline}
        </p>

        <div
          className="table-animate-line mt-6 h-px w-16 bg-[var(--table-cocoa)]/50"
          style={{ "--table-delay": "200ms" } as CSSProperties}
        />

        <h1
          className="table-animate-fade-up mt-6 max-w-xl font-serif text-[48px] leading-[1.02] text-[var(--table-cocoa)] sm:text-[60px] lg:text-[68px]"
          style={{ "--table-delay": "280ms" } as CSSProperties}
        >
          {TABLE_COPY.heroTitle}
        </h1>

        <p
          className="table-animate-fade-up mt-6 max-w-md text-[16px] leading-relaxed text-[var(--table-muted)] sm:text-[17px]"
          style={{ "--table-delay": "420ms" } as CSSProperties}
        >
          {TABLE_COPY.heroSubtitle}
        </p>

        <div
          className="table-animate-fade-up mt-10 flex flex-wrap gap-3"
          style={{ "--table-delay": "560ms" } as CSSProperties}
        >
          <a
            href="#selections"
            className="table-cta inline-flex h-[52px] items-center justify-center rounded-lg px-10 text-[14px] font-semibold tracking-wide transition-transform"
          >
            {TABLE_COPY.heroBrowse}
          </a>
          <Link
            href={TABLE_ROUTES.request}
            className="table-cta-secondary inline-flex h-[52px] items-center justify-center rounded-lg px-8 text-[14px] font-semibold tracking-wide transition-transform"
          >
            {TABLE_COPY.heroRequest}
          </Link>
        </div>
      </div>
    </section>
  );
}
