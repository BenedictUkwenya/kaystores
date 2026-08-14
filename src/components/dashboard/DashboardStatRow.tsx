import type { ReactNode } from "react";
import Link from "next/link";

type MetricProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  accent?: boolean;
  href?: string;
};

export function PortalMetricCard({
  label,
  value,
  hint,
  icon,
  accent,
  href,
}: MetricProps) {
  const content = (
    <div className="group relative overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)] transition-all hover:border-kay-gold/35">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-kay-subtle">
            {label}
          </p>
          <p
            className={`mt-2 font-serif text-[28px] leading-none tracking-tight ${
              accent ? "text-kay-gold" : "text-kay-fg"
            }`}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-2 text-[12px] leading-relaxed text-kay-muted">{hint}</p>
          )}
        </div>
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kay-surface text-kay-gold">
            {icon}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kay-gold">
        {content}
      </Link>
    );
  }
  return content;
}

type Props = {
  stats: MetricProps[];
};

export function DashboardStatRow({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <PortalMetricCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
