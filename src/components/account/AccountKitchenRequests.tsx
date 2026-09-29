import Link from "next/link";
import { formatNaira } from "@/lib/data/home";
import { TABLE_ROUTES } from "@/lib/table/catalog";
import { TABLE_STATUS_LABELS } from "@/components/table/TableRequestStatusTimeline";
import { IconArrowRight } from "@/components/ui/Icons";
import type { TableRequestStatus } from "@/types/table";

export type AccountKitchenRequest = {
  id: string;
  reference: string;
  status: TableRequestStatus;
  category: string;
  occasion: string | null;
  neededBy: string | null;
  /** Only once Kay has sent the quote. */
  quoteAmount: number | null;
  paid: boolean;
  createdAt: string;
};

function statusLine(r: AccountKitchenRequest): { label: string; tone: string } {
  if (r.paid && r.status !== "fulfilled") {
    return { label: "Paid — being made", tone: "bg-emerald-100 text-emerald-800" };
  }
  if (r.status === "quoted") {
    return { label: "Quote ready — accept or decline", tone: "bg-kay-gold text-white" };
  }
  if (r.status === "declined") {
    return { label: TABLE_STATUS_LABELS.declined, tone: "bg-kay-surface text-kay-subtle" };
  }
  if (r.status === "fulfilled") {
    return { label: "Delivered", tone: "bg-emerald-100 text-emerald-800" };
  }
  return { label: TABLE_STATUS_LABELS[r.status], tone: "bg-kay-surface text-kay-muted" };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function AccountKitchenRequests({ requests }: { requests: AccountKitchenRequest[] }) {
  return (
    <section className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-kay-border-light px-6 py-5 sm:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
            Kay Kitchen
          </p>
          <h2 className="mt-1 font-serif text-[26px] text-kay-fg">Custom cakes & treats</h2>
        </div>
        <Link
          href={TABLE_ROUTES.request}
          className="text-[13px] font-medium text-kay-muted transition-colors hover:text-kay-gold"
        >
          New request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="px-6 py-10 text-center sm:px-8">
          <p className="font-serif text-[22px] text-kay-fg">No cake requests yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-kay-muted">
            Send a photo or a quick brief and we&apos;ll come back with a price.
          </p>
          <Link
            href={TABLE_ROUTES.request}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-kay-accent px-8 text-[13px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90"
          >
            Request a custom cake
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-kay-border-light">
          {requests.map((r) => {
            const status = statusLine(r);
            return (
              <li key={r.id}>
                <Link
                  href={TABLE_ROUTES.requestStatus(r.id)}
                  className="group flex flex-wrap items-center gap-4 px-6 py-5 transition-colors hover:bg-kay-surface/60 sm:px-8"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium capitalize text-kay-fg transition-colors group-hover:text-kay-gold">
                        {r.occasion || r.category}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.tone}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-kay-muted">
                      {r.reference}
                      <span className="mx-2 text-kay-border">·</span>
                      Sent {formatDate(r.createdAt)}
                      {r.neededBy && (
                        <>
                          <span className="mx-2 text-kay-border">·</span>
                          Needed {formatDate(r.neededBy)}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:ml-auto">
                    {r.quoteAmount != null && (
                      <p className="font-serif text-[18px] text-kay-fg">
                        {formatNaira(r.quoteAmount)}
                      </p>
                    )}
                    <IconArrowRight className="h-4 w-4 text-kay-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-kay-gold" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
