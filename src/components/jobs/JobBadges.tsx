import type { JobActor, JobKind, JobStage, JobUrgency } from "@/lib/jobs/types";
import {
  JOB_ACTOR_LABELS,
  JOB_KIND_LABELS,
  JOB_STAGE_LABELS,
  JOB_URGENCY_LABELS,
} from "@/lib/jobs/labels";

const KIND_TONE: Record<JobKind, string> = {
  gift: "bg-[#111111] text-kay-gold",
  kitchen: "bg-rose-50 text-rose-800",
  concierge: "bg-sky-50 text-sky-800",
};

export function JobKindBadge({ kind }: { kind: JobKind }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${KIND_TONE[kind]}`}
    >
      {JOB_KIND_LABELS[kind]}
    </span>
  );
}

export function JobStageBadge({ stage }: { stage: JobStage }) {
  const tone =
    stage === "done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : stage === "cancelled"
        ? "border-kay-border bg-kay-surface text-kay-muted"
        : "border-kay-border-light bg-kay-surface text-kay-fg";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}>
      {JOB_STAGE_LABELS[stage]}
    </span>
  );
}

export function JobUrgencyBadge({ urgency }: { urgency: JobUrgency }) {
  if (urgency === "normal") return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
        urgency === "overdue" ? "bg-red-600 text-white" : "bg-amber-100 text-amber-900"
      }`}
    >
      {JOB_URGENCY_LABELS[urgency]}
    </span>
  );
}

const ACTOR_TONE: Record<JobActor, string> = {
  admin: "bg-kay-gold text-[#111111]",
  vendor: "bg-kay-surface text-kay-fg border border-kay-border-light",
  client: "bg-kay-surface text-kay-fg border border-kay-border-light",
  none: "bg-kay-surface text-kay-muted border border-kay-border-light",
};

export function JobActorBadge({ actor }: { actor: JobActor }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACTOR_TONE[actor]}`}
    >
      {JOB_ACTOR_LABELS[actor]}
    </span>
  );
}
