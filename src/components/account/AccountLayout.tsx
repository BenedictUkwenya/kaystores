import Link from "next/link";
import type { ReactNode } from "react";

type AccountLayoutProps = {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
};

export function AccountLayout({
  children,
  eyebrow = "Your private client space",
  title,
  description,
}: AccountLayoutProps) {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-kay-gold-light/35 via-kay-surface/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-kay-gold/8 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1100px] px-4 pb-16 pt-8 sm:px-10 lg:pb-20 lg:pt-10">
        <nav className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-kay-subtle">
          <Link href="/" className="transition-colors hover:text-kay-fg">
            Home
          </Link>
          <span aria-hidden>/</span>
          <span className="text-kay-muted">Your account</span>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-kay-gold">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-[28px] leading-[1.08] tracking-tight text-kay-fg sm:text-[38px] lg:text-[48px]">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-xl text-[15px] leading-[1.7] text-kay-muted">
              {description}
            </p>
          )}
        </header>

        <div className="mt-10 lg:mt-12">{children}</div>
      </div>
    </div>
  );
}
