const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-900",
  live: "border-emerald-200 bg-emerald-50 text-emerald-900",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-900",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-900",
  available: "border-sky-200 bg-sky-50 text-sky-900",
  rejected: "border-red-200 bg-red-50 text-red-900",
  suspended: "border-amber-200 bg-amber-50 text-amber-900",
  blocked: "border-red-200 bg-red-50 text-red-900",
  active: "border-emerald-200 bg-emerald-50 text-emerald-900",
  admin: "border-violet-200 bg-violet-50 text-violet-900",
  vendor: "border-sky-200 bg-sky-50 text-sky-900",
  customer: "border-kay-border bg-kay-surface text-kay-muted",
  draft: "border-kay-border bg-kay-surface text-kay-muted",
  pending_review: "border-amber-200 bg-amber-50 text-amber-900",
  awaiting_payment: "border-amber-200 bg-amber-50 text-amber-900",
  awaiting_hub_delivery: "border-sky-200 bg-sky-50 text-sky-900",
  at_hub: "border-sky-200 bg-sky-50 text-sky-900",
  qc_passed: "border-emerald-200 bg-emerald-50 text-emerald-900",
  dispatched: "border-emerald-200 bg-emerald-50 text-emerald-900",
  processing: "border-sky-200 bg-sky-50 text-sky-900",
  unpaid: "border-amber-200 bg-amber-50 text-amber-900",
  confirmed: "border-kay-gold/30 bg-kay-gold-light/40 text-kay-fg",
};

type Props = {
  status: string;
  label?: string;
};

export function StatusBadge({ status, label }: Props) {
  const style =
    STATUS_STYLES[status] ??
    "border-kay-border bg-kay-surface text-kay-muted";
  const text = label ?? status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${style}`}
    >
      {text}
    </span>
  );
}
