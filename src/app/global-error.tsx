"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-kay-bg antialiased">
        <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-10">
          <div className="mx-auto max-w-lg text-center">
            <p className="text-[11px] uppercase tracking-[0.14em] text-kay-gold">
              Kay Stores
            </p>
            <h1 className="mt-2 font-serif text-[32px] text-kay-fg sm:text-[36px]">
              Something went wrong
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-kay-muted">
              We couldn&apos;t load Kay Stores just now. Please try again in a
              moment.
            </p>
            {error.digest && (
              <p className="mt-2 text-[12px] text-kay-subtle">Reference: {error.digest}</p>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-11 items-center justify-center rounded-full bg-kay-fg px-8 text-[13px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90"
              >
                Try again
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- router may be unavailable here */}
              <a
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-8 text-[13px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
              >
                Back to home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
