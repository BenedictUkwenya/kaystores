import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  icon?: ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function DashboardEmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-kay-border bg-kay-surface-elevated/80 px-6 py-14 text-center sm:px-8">
      {icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-kay-surface text-kay-gold shadow-[var(--kay-card-shadow)]">
          {icon}
        </div>
      )}
      <p className="mt-5 font-serif text-[24px] text-kay-fg">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-kay-muted">
        {description}
      </p>
      {(actionHref && actionLabel) || (secondaryHref && secondaryLabel) ? (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {actionHref && actionLabel && (
            <Link
              href={actionHref}
              className="inline-flex h-11 items-center justify-center rounded-full bg-kay-accent px-7 text-[13px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90"
            >
              {actionLabel}
            </Link>
          )}
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="inline-flex h-11 items-center justify-center rounded-full border border-kay-border px-7 text-[13px] font-medium text-kay-fg hover:border-kay-fg"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
