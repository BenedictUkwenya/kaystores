"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
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
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-10">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kay-surface text-kay-gold">
          <span className="font-serif text-2xl">!</span>
        </div>
        <p className="mt-6 text-[11px] uppercase tracking-[0.14em] text-kay-gold">
          Something went wrong
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-kay-fg sm:text-[36px]">
          That didn&apos;t go as planned
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-kay-muted">
          We hit an unexpected snag loading this page. Please try again — if it
          keeps happening, our team is here to help.
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
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-8 text-[13px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
