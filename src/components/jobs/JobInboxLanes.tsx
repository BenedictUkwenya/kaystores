import type { Job, JobActor } from "@/lib/jobs/types";
import { JobCard } from "@/components/jobs/JobCard";

const LANES: { actor: JobActor; title: string; hint: string; empty: string }[] = [
  {
    actor: "admin",
    title: "Your turn",
    hint: "Kay needs to do something. Oldest and most urgent first.",
    empty: "Nothing waiting on you. Nice.",
  },
  {
    actor: "vendor",
    title: "Waiting on vendor",
    hint: "A vendor has to price, make or send something. Chase them if it's overdue.",
    empty: "No vendor is holding anything up.",
  },
  {
    actor: "client",
    title: "Waiting on client",
    hint: "The client has to pay, accept or share details.",
    empty: "No client is holding anything up.",
  },
];

export function JobInboxLanes({ jobs }: { jobs: Job[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr_1fr]">
      {LANES.map((lane) => {
        const laneJobs = jobs.filter((job) => job.actor === lane.actor);
        return (
          <section key={lane.actor} className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="font-serif text-[20px] text-kay-fg">
                {lane.title}
                <span
                  className={`ml-2 inline-flex min-w-[24px] items-center justify-center rounded-full px-2 py-0.5 align-middle text-[11px] font-semibold ${
                    lane.actor === "admin" && laneJobs.length > 0
                      ? "bg-kay-gold text-[#111111]"
                      : "bg-kay-surface text-kay-muted"
                  }`}
                >
                  {laneJobs.length}
                </span>
              </h2>
            </div>
            <p className="-mt-2 mb-3 text-[12px] text-kay-muted">{lane.hint}</p>
            {laneJobs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-kay-border-light px-4 py-6 text-center text-[12px] text-kay-muted">
                {lane.empty}
              </p>
            ) : (
              <div className="space-y-3">
                {laneJobs.map((job) => (
                  <JobCard key={job.key} job={job} compact={lane.actor !== "admin"} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
