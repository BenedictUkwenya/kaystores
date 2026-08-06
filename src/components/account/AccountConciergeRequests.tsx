import Link from "next/link";
import type { ClientConciergeStatus } from "@/types/concierge";
import { formatNaira } from "@/lib/data/home";
import {
  CONCIERGE_STATUS_LABELS,
  formatConciergeDate,
} from "@/lib/concierge/status";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { IconArrowRight, IconDiamond } from "@/components/ui/Icons";

type Props = {
  requests: ClientConciergeStatus[];
};

export function AccountConciergeRequests({ requests }: Props) {
  const active = requests.filter((r) => r.status !== "closed");

  return (
    <section className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-kay-border-light px-6 py-5 sm:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
            Concierge
          </p>
          <h2 className="mt-1 font-serif text-[26px] text-kay-fg">
            Sourcing requests
          </h2>
        </div>
        <Link
          href="/concierge/status"
          className="text-[13px] font-medium text-kay-muted transition-colors hover:text-kay-gold"
        >
          Track by reference
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="px-6 py-14 text-center sm:px-8 sm:py-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-kay-surface text-kay-gold">
            <IconDiamond className="h-7 w-7" />
          </div>
          <p className="mt-6 font-serif text-[24px] text-kay-fg">
            No concierge requests
          </p>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-kay-muted">
            Submit a sourcing request and track progress here — from review
            through vendor sourcing to your final update from Kay.
          </p>
          <Link
            href="/concierge"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-kay-accent px-8 text-[13px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90"
          >
            Start a request
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-kay-border-light">
          {requests.map((request) => (
            <li key={request.id}>
              <Link
                href={`/concierge/status/${request.id}`}
                className="group flex flex-wrap items-center gap-4 px-6 py-5 transition-colors hover:bg-kay-surface/60 sm:px-8 sm:py-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-kay-surface text-kay-gold">
                  <IconDiamond className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-kay-fg transition-colors group-hover:text-kay-gold">
                      {request.productName}
                    </p>
                    <StatusBadge
                      status={request.status}
                      label={CONCIERGE_STATUS_LABELS[request.status]}
                    />
                  </div>
                  <p className="mt-1 text-[13px] text-kay-muted">
                    {request.referenceNumber}
                    <span className="mx-2 text-kay-border">·</span>
                    {formatConciergeDate(request.createdAt)}
                    {request.brand && (
                      <>
                        <span className="mx-2 text-kay-border">·</span>
                        {request.brand}
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4 sm:ml-auto">
                  <p className="font-serif text-[18px] text-kay-fg">
                    {formatNaira(request.budget)}
                  </p>
                  <IconArrowRight className="h-4 w-4 text-kay-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-kay-gold" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {active.length > 0 && requests.length > active.length && (
        <p className="border-t border-kay-border-light px-6 py-3 text-[12px] text-kay-muted sm:px-8">
          {active.length} active · {requests.length - active.length} closed
        </p>
      )}
    </section>
  );
}
