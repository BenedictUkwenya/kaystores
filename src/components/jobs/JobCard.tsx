import Link from "next/link";
import type { Job, VendorJob } from "@/lib/jobs/types";
import { formatJobMoney } from "@/lib/jobs/labels";
import { JobActionButton } from "@/components/jobs/JobAction";
import {
  JobActorBadge,
  JobKindBadge,
  JobStageBadge,
  JobUrgencyBadge,
} from "@/components/jobs/JobBadges";

type Props = {
  job: Job;
  /** Board columns: hide stage (the column says it) and tighten spacing. */
  compact?: boolean;
  showActor?: boolean;
};

export function JobCard({ job, compact = false, showActor = false }: Props) {
  const vendors = job.vendorNames.length ? job.vendorNames.join(", ") : "No vendor yet";
  return (
    <article
      className={`rounded-2xl border bg-kay-surface-elevated shadow-[var(--kay-card-shadow)] transition-colors ${
        job.urgency === "overdue"
          ? "border-red-300"
          : job.actor === "admin"
            ? "border-kay-gold/40"
            : "border-kay-border-light"
      } ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <JobKindBadge kind={job.kind} />
        {!compact && <JobStageBadge stage={job.stage} />}
        {showActor && <JobActorBadge actor={job.actor} />}
        <JobUrgencyBadge urgency={job.urgency} />
        <span className="ml-auto text-[11px] text-kay-subtle">{job.reference}</span>
      </div>

      <Link href={job.href} className="mt-2 block group">
        <p className={`font-medium text-kay-fg group-hover:underline ${compact ? "text-[13px]" : "text-[15px]"}`}>
          {job.title}
        </p>
        <p className="mt-0.5 text-[12px] text-kay-muted">
          {job.clientName} → Kay → {vendors}
        </p>
        {!compact && <p className="text-[11px] text-kay-subtle">{job.subtitle}</p>}
      </Link>

      <p
        className={`mt-2 rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
          job.actor === "admin" ? "bg-kay-gold-light/40 text-kay-fg" : "bg-kay-surface text-kay-muted"
        }`}
      >
        {job.nextStep}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.quickAction && job.actor === "admin" && (
          <JobActionButton
            kind={job.kind}
            id={job.id}
            body={{ action: job.quickAction.action, itemId: job.quickAction.itemId }}
            label={job.quickAction.label}
            confirm={job.quickAction.confirm}
          />
        )}
        <Link
          href={job.href}
          className="inline-flex h-9 items-center rounded-full border border-kay-border px-4 text-[12px] font-medium text-kay-fg hover:border-kay-fg"
        >
          {job.actor === "admin" && !job.quickAction ? "Open & do it" : "Open"}
        </Link>
        {job.clientAmount != null && (
          <span className="ml-auto text-[12px] font-medium text-kay-fg">
            {formatJobMoney(job.clientAmount)}
          </span>
        )}
      </div>
    </article>
  );
}

export function VendorJobCard({ job }: { job: VendorJob }) {
  return (
    <Link
      href={job.href}
      className={`block rounded-2xl border bg-kay-surface-elevated p-4 shadow-[var(--kay-card-shadow)] transition-colors hover:border-kay-gold ${
        job.urgency === "overdue"
          ? "border-red-300"
          : job.tab === "todo"
            ? "border-kay-gold/40"
            : "border-kay-border-light"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <JobKindBadge kind={job.kind} />
        <JobStageBadge stage={job.stage} />
        <JobUrgencyBadge urgency={job.urgency} />
        <span className="ml-auto text-[11px] text-kay-subtle">{job.reference}</span>
      </div>
      <p className="mt-2 text-[15px] font-medium text-kay-fg">{job.title}</p>
      <p className="text-[12px] text-kay-muted">{job.subtitle}</p>
      <p
        className={`mt-2 rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
          job.tab === "todo" ? "bg-kay-gold-light/40 text-kay-fg" : "bg-kay-surface text-kay-muted"
        }`}
      >
        {job.nextStep}
      </p>
      <div className="mt-2 flex items-center justify-between text-[12px]">
        <span className="font-medium text-kay-gold">
          {job.tab === "todo" ? "Open & do it →" : "View →"}
        </span>
        {job.amount != null && (
          <span className="font-medium text-kay-fg">{formatJobMoney(job.amount)}</span>
        )}
      </div>
    </Link>
  );
}
