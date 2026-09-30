import type { Job, JobKind } from "@/lib/jobs/types";
import { BOARD_STAGES, JOB_STAGE_HINTS, JOB_STAGE_LABELS } from "@/lib/jobs/labels";
import { JobCard } from "@/components/jobs/JobCard";

const CLOSED_LIMIT = 12;

/** Kanban-style board: one column per stage, left (new) to right (done). */
export function JobBoard({ kind, jobs }: { kind: JobKind; jobs: Job[] }) {
  const stages = BOARD_STAGES[kind];
  return (
    <div className="dashboard-nav-scroll -mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <div className="flex min-w-max gap-4">
        {stages.map((stage) => {
          const all = jobs.filter((job) => job.stage === stage);
          const closed = stage === "done" || stage === "cancelled";
          // Closed columns show the most recent; open columns keep urgency order.
          const visible = closed
            ? [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, CLOSED_LIMIT)
            : all;
          const yourTurn = all.filter((job) => job.actor === "admin").length;
          return (
            <section
              key={stage}
              className={`flex w-[280px] shrink-0 flex-col rounded-2xl border p-3 ${
                closed ? "border-kay-border-light bg-kay-surface/40" : "border-kay-border-light bg-kay-surface/70"
              }`}
            >
              <header className="mb-3 px-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-kay-fg">{JOB_STAGE_LABELS[stage]}</h3>
                  <span className="text-[11px] text-kay-muted">
                    {all.length}
                    {yourTurn > 0 && (
                      <span className="ml-1.5 rounded-full bg-kay-gold px-1.5 py-0.5 text-[10px] font-semibold text-[#111111]">
                        {yourTurn} yours
                      </span>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-kay-muted">{JOB_STAGE_HINTS[stage]}</p>
              </header>
              <div className="space-y-2.5">
                {visible.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-kay-border-light px-3 py-4 text-center text-[11px] text-kay-subtle">
                    Empty
                  </p>
                ) : (
                  visible.map((job) => <JobCard key={job.key} job={job} compact showActor={!closed} />)
                )}
                {closed && all.length > visible.length && (
                  <p className="px-1 text-[11px] text-kay-subtle">
                    +{all.length - visible.length} older not shown
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
