import Link from "next/link";
import type { ReactNode } from "react";

type ContentPageLayoutProps = {
  breadcrumbs: { label: string; href?: string }[];
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function ContentPageLayout({
  breadcrumbs,
  eyebrow,
  title,
  description,
  children,
}: ContentPageLayoutProps) {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
      <nav className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-kay-subtle">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.label} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-kay-fg">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-kay-muted">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <header className="mt-8 max-w-2xl">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-kay-gold">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-serif text-[28px] leading-[1.1] tracking-tight text-kay-fg sm:text-[36px] lg:text-[42px]">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-[15px] leading-[1.7] text-kay-muted">
            {description}
          </p>
        )}
      </header>

      <div className="mt-10 space-y-10">{children}</div>
    </div>
  );
}

export function ContentSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-4 sm:p-6 lg:p-8">
      {title && (
        <h2 className="font-serif text-[22px] text-kay-fg">{title}</h2>
      )}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function ContentProse({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 text-[15px] leading-[1.75] text-kay-muted">
      {children}
    </div>
  );
}
