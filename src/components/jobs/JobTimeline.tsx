export type JobTimelineEvent = {
  at: string | null | undefined;
  label: string;
  detail?: string | null;
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** What has happened so far, oldest first. Events without a time are skipped. */
export function JobTimeline({ events }: { events: JobTimelineEvent[] }) {
  const items = events
    .filter((e): e is JobTimelineEvent & { at: string } => Boolean(e.at))
    .sort((a, b) => a.at.localeCompare(b.at));
  if (items.length === 0) return null;
  return (
    <section className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-subtle">
        What&apos;s happened
      </p>
      <ol className="mt-3 space-y-3">
        {items.map((e, i) => (
          <li key={`${e.label}-${i}`} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-kay-gold" />
            <div className="min-w-0">
              <p className="text-[13px] text-kay-fg">{e.label}</p>
              {e.detail && <p className="text-[12px] text-kay-muted">{e.detail}</p>}
              <p className="text-[11px] text-kay-subtle">{formatWhen(e.at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
