import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  icon?: ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function DashboardEmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: Props) {
  return (
    <div className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated px-6 py-14 text-center shadow-[var(--kay-card-shadow)] sm:px-8">
      {icon && (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-kay-surface text-kay-gold">
          {icon}
        </div>
      )}
      <p className="mt-6 font-serif text-[24px] text-kay-fg">{title}</p>
      <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-kay-muted">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-kay-accent px-8 text-[13px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
