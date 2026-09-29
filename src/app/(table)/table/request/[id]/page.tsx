import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@/lib/data/home";
import {
  getTableRequestById,
} from "@/lib/table/repository";
import { TABLE_ROUTES } from "@/lib/table/catalog";
import { resolveTableViewer } from "@/lib/orders/access";
import { TableRequestChat } from "@/components/table/TableRequestChat";
import { TableQuoteDeclineButton } from "@/components/table/TableQuoteDeclineButton";
import {
  PaymentReturnVerifier,
  PaystackPayButton,
} from "@/components/payments/PaystackPayButton";
import { isPaystackConfigured } from "@/lib/payments/config";
import { tablePaymentBlocker } from "@/lib/table/payment";
import {
  TABLE_STATUS_LABELS,
  TableRequestStatusTimeline,
} from "@/components/table/TableRequestStatusTimeline";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ k?: string; payment?: string; reference?: string; trxref?: string }>;
};

export default async function TableRequestStatusPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  let request;
  try {
    request = await getTableRequestById(id);
  } catch {
    notFound();
  }
  if (!request) notFound();
  if (!(await resolveTableViewer(request, query.k))) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-serif text-[28px] text-[var(--table-ink)]">This request is private</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--table-muted)]">
          Open it from the link in your Kay Kitchen email, or sign in with the
          account you used to send it.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[var(--table-ink)] px-8 text-[13px] font-medium text-[var(--table-paper)]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const paid = request.paymentStatus === "paid";
  const paystackOn = isPaystackConfigured();
  const canPay = !tablePaymentBlocker(request);
  const returnReference =
    query.payment === "return" ? query.reference || query.trxref || "" : "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 lg:px-10 lg:py-14">
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--table-muted)]">
        <Link href={TABLE_ROUTES.home} className="hover:text-[var(--table-ink)]">
          Kay Kitchen
        </Link>
        <span>/</span>
        <span className="text-[var(--table-ink)]">Request</span>
      </nav>

      <div className="mt-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--table-accent)]">
          Custom request
        </p>
        <h1 className="mt-2 font-serif text-[30px] text-[var(--table-ink)] sm:text-[36px]">
          {request.occasion || request.category}
        </h1>
        <p className="mt-3 text-[14px] text-[var(--table-muted)]">
          Reference{" "}
          <span className="font-medium text-[var(--table-ink)]">
            {request.reference}
          </span>
          <span className="mx-2">·</span>
          {TABLE_STATUS_LABELS[request.status]}
        </p>
      </div>

      <div className="mt-8">
        <TableRequestStatusTimeline status={request.status} />
      </div>

      {returnReference && !paid && (
        <div className="mt-6">
          <PaymentReturnVerifier reference={returnReference} />
        </div>
      )}

      {paid && (
        <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[13px] text-emerald-900">
          Paid{request.paidAt ? ` on ${new Date(request.paidAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}` : ""} — your baker is on it.
        </p>
      )}

      {canPay && (
        <div className="mt-6 rounded-2xl border border-[var(--table-accent)]/40 bg-[var(--table-paper)] p-5 text-center">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--table-accent)]">
            Your quote
          </p>
          <p className="mt-2 font-serif text-[28px] text-[var(--table-ink)]">
            {formatNaira(Number(request.quoteAmount))}
          </p>
          {request.quoteNote && (
            <p className="mt-1 text-[13px] text-[var(--table-muted)]">{request.quoteNote}</p>
          )}
          <div className="mt-4 flex flex-col items-center">
            <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
              {paystackOn ? (
                <PaystackPayButton
                  kind="table"
                  id={request.id}
                  label="Accept & pay"
                  className="w-full sm:w-auto"
                />
              ) : (
                <p className="text-[13px] text-[var(--table-muted)]">
                  Happy with the quote? Reply below and we&apos;ll send payment details.
                </p>
              )}
              <TableQuoteDeclineButton requestId={request.id} />
            </div>
            <p className="mt-3 text-[12px] text-[var(--table-muted)]">
              Want changes first? Message us below before paying.
            </p>
          </div>
        </div>
      )}

      <dl className="mt-10 grid gap-4 rounded-2xl border border-[var(--table-line)] bg-[var(--table-paper)] p-5 text-[13px] sm:grid-cols-2">
        {request.servings && (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Servings
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">{request.servings}</dd>
          </div>
        )}
        {request.neededBy && (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Needed by
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">{request.neededBy}</dd>
          </div>
        )}
        <div>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
            Fulfilment
          </dt>
          <dd className="mt-1 text-[var(--table-ink)]">
            {request.fulfillmentMethod === "pickup"
              ? `Pickup${request.pickupHubName ? ` — ${request.pickupHubName}` : " at Kay hub"}`
              : `Kay delivery${
                  request.city
                    ? ` — ${request.city}${request.state ? `, ${request.state}` : ""}`
                    : ""
                }`}
          </dd>
        </div>
        {request.budget != null && (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Budget
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">
              {formatNaira(request.budget)}
            </dd>
          </div>
        )}
        {request.flavourNotes && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Flavours
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">{request.flavourNotes}</dd>
          </div>
        )}
        {request.styleNotes && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Style
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">{request.styleNotes}</dd>
          </div>
        )}
        {request.deliveryAddress && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Deliver to
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">
              {request.recipientName ? `${request.recipientName} — ` : ""}
              {request.deliveryAddress}
            </dd>
          </div>
        )}
        {request.messageOnItem && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Message on the {request.category === "cake" ? "cake" : "item"}
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">{request.messageOnItem}</dd>
          </div>
        )}
        {request.allergies && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Allergies & dietary needs
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">{request.allergies}</dd>
          </div>
        )}
        {request.quoteAmount != null &&
          !canPay &&
          request.status !== "submitted" &&
          request.status !== "reviewing" && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Quote
            </dt>
            <dd className="mt-1 font-medium text-[var(--table-ink)]">
              {formatNaira(request.quoteAmount)}
              {request.quoteNote ? ` — ${request.quoteNote}` : ""}
            </dd>
          </div>
        )}
        {request.assignedVendorName && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Baker
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">
              {request.assignedVendorName}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-8">
        <TableRequestChat requestId={request.id} viewerRole="customer" />
      </div>
    </div>
  );
}
