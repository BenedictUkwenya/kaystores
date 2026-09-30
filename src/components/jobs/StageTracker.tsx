import type { JobKind, JobStage } from "@/lib/jobs/types";
import { JOB_STAGE_LABELS, TRACKER_STAGES } from "@/lib/jobs/labels";

export function StageTracker({ kind, stage }: { kind: JobKind; stage: JobStage }) {
  const steps = TRACKER_STAGES[kind];
  const current = steps.indexOf(stage);

  if (stage === "cancelled") {
    return (
      <div className="rounded-2xl border border-kay-border-light bg-kay-surface px-4 py-3 text-[13px] text-kay-muted">
        This job was cancelled.
      </div>
    );
  }

  return (
    <ol className="dashboard-nav-scroll flex gap-1 overflow-x-auto pb-1" aria-label="Progress">
      {steps.map((step, index) => {
        const done = index < current || stage === "done";
        const active = index === current && stage !== "done";
        return (
          <li key={step} className="flex min-w-[92px] flex-1 flex-col items-center gap-1.5 text-center">
            <div className="flex w-full items-center">
              <span
                className={`h-0.5 flex-1 ${index === 0 ? "opacity-0" : done || active ? "bg-kay-gold" : "bg-kay-border-light"}`}
              />
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  active
                    ? "bg-kay-gold text-[#111111] ring-4 ring-kay-gold/25"
                    : done
                      ? "bg-[#111111] text-kay-gold"
                      : "border border-kay-border bg-kay-surface-elevated text-kay-subtle"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : index + 1}
              </span>
              <span
                className={`h-0.5 flex-1 ${index === steps.length - 1 ? "opacity-0" : done ? "bg-kay-gold" : "bg-kay-border-light"}`}
              />
            </div>
            <span className={`text-[11px] leading-tight ${active ? "font-semibold text-kay-fg" : "text-kay-muted"}`}>
              {JOB_STAGE_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
