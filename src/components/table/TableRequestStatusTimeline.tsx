import { TABLE_COPY } from "@/lib/table/catalog";
import type { TableRequestStatus } from "@/types/table";

export const TABLE_STATUS_LABELS: Record<TableRequestStatus, string> = {
  submitted: "Submitted",
  reviewing: "Under review",
  quoted: "Quoted",
  accepted: "Accepted",
  declined: "Declined",
  fulfilled: "Fulfilled",
};

const FLOW: TableRequestStatus[] = [
  "submitted",
  "reviewing",
  "quoted",
  "accepted",
  "fulfilled",
];

export function TableRequestStatusTimeline({
  status,
}: {
  status: TableRequestStatus;
}) {
  if (status === "declined") {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-800">
        This request was declined. Message us if you&apos;d like to revise the brief.
      </p>
    );
  }

  const idx = FLOW.indexOf(status);

  return (
    <ol className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {FLOW.map((step, i) => {
        const done = i <= idx;
        return (
          <li
            key={step}
            className={`rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide ${
              done
                ? "bg-[var(--table-ink)] text-[var(--table-paper)]"
                : "border border-[var(--table-line)] text-[var(--table-muted)]"
            }`}
          >
            {TABLE_STATUS_LABELS[step]}
          </li>
        );
      })}
    </ol>
  );
}

export { TABLE_COPY };
