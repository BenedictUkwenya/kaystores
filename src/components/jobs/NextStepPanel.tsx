import type { ReactNode } from "react";
import type { JobActor } from "@/lib/jobs/types";
import { JOB_ACTOR_LABELS } from "@/lib/jobs/labels";

type Props = {
  actor: JobActor;
  nextStep: string;
  /** The controls for the step (only rendered when it's the viewer's turn). */
  children?: ReactNode;
  /** Shown when it's someone else's turn, e.g. "Chase the vendor" chat hint. */
  waitingHint?: ReactNode;
};

/** The one box that says what happens next and, if it's your turn, how to do it. */
export function NextStepPanel({ actor, nextStep, children, waitingHint }: Props) {
  const yourTurn = actor === "admin";
  return (
    <section
      className={`rounded-2xl border p-5 shadow-[var(--kay-card-shadow)] ${
        yourTurn ? "border-kay-gold/50 bg-kay-gold-light/25" : "border-kay-border-light bg-kay-surface-elevated"
      }`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
          yourTurn ? "text-kay-gold" : "text-kay-subtle"
        }`}
      >
        {actor === "none" ? "Status" : `Next step · ${JOB_ACTOR_LABELS[actor]}`}
      </p>
      <p className="mt-2 font-serif text-[20px] leading-snug text-kay-fg">{nextStep}</p>
      {yourTurn && children && <div className="mt-4 space-y-4">{children}</div>}
      {!yourTurn && waitingHint && (
        <div className="mt-3 text-[12px] leading-relaxed text-kay-muted">{waitingHint}</div>
      )}
    </section>
  );
}
