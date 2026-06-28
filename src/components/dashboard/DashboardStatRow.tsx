type StatCellProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function StatCell({ label, value, accent }: StatCellProps) {
  return (
    <div className="px-4 py-4 sm:px-5 sm:py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-kay-subtle">
        {label}
      </p>
      <p
        className={`mt-1 font-serif text-[20px] sm:text-[22px] lg:text-[24px] ${
          accent ? "text-kay-gold" : "text-kay-fg"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

type Props = {
  stats: { label: string; value: string; accent?: boolean }[];
};

export function DashboardStatRow({ stats }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
      <div className="grid grid-cols-2 divide-x divide-y divide-kay-border-light lg:grid-cols-4 lg:divide-y-0">
        {stats.map((stat) => (
          <StatCell key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}
