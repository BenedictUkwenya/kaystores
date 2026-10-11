import Link from "next/link";

/** Quiet way into cakes. Same card language as the rest of the shop. */
export function KitchenEntry({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/table"
      className={`group flex items-center justify-between gap-4 rounded-xl border border-kay-border bg-kay-surface-elevated px-5 py-4 transition-colors hover:border-kay-gold/70 ${className}`}
      style={{ boxShadow: "var(--kay-card-shadow)" }}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
          Kay&apos;s Kitchen
        </p>
        <p className="mt-1 truncate font-serif text-[18px] leading-tight text-kay-fg sm:text-[20px]">
          Cakes for every celebration
        </p>
      </div>
      <span className="shrink-0 text-[13px] font-medium text-kay-fg">
        See cakes
        <span className="ml-1 text-kay-subtle transition-colors group-hover:text-kay-fg">
          →
        </span>
      </span>
    </Link>
  );
}
