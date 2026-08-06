"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ConciergeQueueCounts, ConciergeQueueFilter } from "@/types/concierge";

const TABS: { id: ConciergeQueueFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs_dispatch", label: "Needs dispatch" },
  { id: "awaiting_quotes", label: "Awaiting quotes" },
  { id: "ready_to_release", label: "Ready to present" },
  { id: "client_deciding", label: "Awaiting client" },
  { id: "in_fulfilment", label: "In fulfilment" },
  { id: "closed", label: "Closed" },
];

type Props = {
  counts: ConciergeQueueCounts;
  total: number;
  page: number;
  pageSize: number;
};

export function AdminConciergeQueue({ counts, total, page, pageSize }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = (searchParams.get("queue") as ConciergeQueueFilter) ?? "all";

  function setQueue(queue: ConciergeQueueFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (queue === "all") params.delete("queue");
    else params.set("queue", queue);
    params.delete("page");
    router.push(`/admin/concierge?${params.toString()}`);
  }

  function countFor(id: ConciergeQueueFilter): number {
    const map: Record<ConciergeQueueFilter, number> = {
      all:
        counts.needsDispatch +
        counts.awaitingQuotes +
        counts.readyToRelease +
        counts.clientDeciding +
        counts.inFulfilment +
        counts.closed,
      needs_dispatch: counts.needsDispatch,
      awaiting_quotes: counts.awaitingQuotes,
      ready_to_release: counts.readyToRelease,
      client_deciding: counts.clientDeciding,
      in_fulfilment: counts.inFulfilment,
      closed: counts.closed,
    };
    return map[id];
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/admin/concierge?${qs}` : "/admin/concierge";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setQueue(tab.id)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              active === tab.id
                ? "bg-kay-fg text-kay-bg"
                : "border border-kay-border text-kay-muted hover:border-kay-fg"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-70">({countFor(tab.id)})</span>
          </button>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-kay-muted">
          <p>
            Page {page} of {totalPages} · {total} in this queue
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="rounded-full border border-kay-border px-3 py-1 hover:border-kay-fg"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="rounded-full border border-kay-border px-3 py-1 hover:border-kay-fg"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
