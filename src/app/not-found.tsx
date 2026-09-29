import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-10">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kay-surface text-kay-gold">
          <span className="font-serif text-2xl">?</span>
        </div>
        <p className="mt-6 text-[11px] uppercase tracking-[0.14em] text-kay-gold">
          404
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-kay-fg sm:text-[36px]">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-kay-muted">
          The link may be broken or the page may have moved. Let&apos;s get you
          back to something lovely.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-kay-fg px-8 text-[13px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90"
          >
            Back to home
          </Link>
          <Link
            href="/gifts"
            className="inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-8 text-[13px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
          >
            Browse gifts
          </Link>
        </div>
      </div>
    </main>
  );
}
