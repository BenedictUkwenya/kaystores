import Link from "next/link";
import type { ReactNode } from "react";
import type { Job } from "@/lib/jobs/types";
import { JOB_KIND_BOARD_HREF, JOB_KIND_LABELS } from "@/lib/jobs/labels";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { StageTracker } from "@/components/jobs/StageTracker";
import { NextStepPanel } from "@/components/jobs/NextStepPanel";
import { JobUrgencyBadge } from "@/components/jobs/JobBadges";
import { JobTimeline, type JobTimelineEvent } from "@/components/jobs/JobTimeline";

type Props = {
  job: Job;
  controls?: ReactNode;
  waitingHint?: ReactNode;
  parties: ReactNode;
  details: ReactNode;
  chat?: ReactNode;
  more?: ReactNode;
  timeline: JobTimelineEvent[];
};

/** Layout every admin job page shares: where it is, what's next, who's involved. */
export function JobPageShell({
  job,
  controls,
  waitingHint,
  parties,
  details,
  chat,
  more,
  timeline,
}: Props) {
  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow={`${JOB_KIND_LABELS[job.kind]} · ${job.reference}`}
      title={job.title}
      description={job.subtitle}
      badge="Admin"
      actions={
        <Link
          href={JOB_KIND_BOARD_HREF[job.kind]}
          className="inline-flex h-10 items-center rounded-full border border-kay-border px-5 text-[12px] font-medium text-kay-fg hover:border-kay-fg"
        >
          ← All {JOB_KIND_LABELS[job.kind].toLowerCase()}s
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-4 shadow-[var(--kay-card-shadow)]">
          <div className="mb-3 flex items-center gap-2">
            <JobUrgencyBadge urgency={job.urgency} />
            {job.neededBy && (
              <span className="text-[12px] text-kay-muted">Needed by {job.neededBy}</span>
            )}
          </div>
          <StageTracker kind={job.kind} stage={job.stage} />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <NextStepPanel actor={job.actor} nextStep={job.nextStep} waitingHint={waitingHint}>
              {controls}
            </NextStepPanel>
            {parties}
            {details}
            {chat && (
              <section className="space-y-2">
                <h2 className="font-serif text-[20px] text-kay-fg">Messages</h2>
                {chat}
              </section>
            )}
          </div>
          <aside className="space-y-4">
            <JobTimeline events={timeline} />
            {more && (
              <details className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-4">
                <summary className="cursor-pointer text-[13px] font-medium text-kay-fg">
                  More actions
                </summary>
                <div className="mt-4 space-y-5">{more}</div>
              </details>
            )}
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-subtle">{title}</p>
      <div className="mt-3 space-y-1.5 text-[13px] text-kay-muted">{children}</div>
    </section>
  );
}

export function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <p>
      <span className="text-kay-subtle">{label}: </span>
      <span className="text-kay-fg">{value}</span>
    </p>
  );
}
