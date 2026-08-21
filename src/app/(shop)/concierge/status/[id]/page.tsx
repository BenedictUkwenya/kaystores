import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchClientConciergeDetail } from "@/lib/concierge/dispatch";
import {
  CONCIERGE_STATUS_LABELS,
  formatConciergeDate,
} from "@/lib/concierge/status";
import { ConciergeOfferResponse } from "@/components/concierge/ConciergeOfferResponse";
import { ConciergePaymentSection } from "@/components/concierge/ConciergePaymentSection";
import { ConciergeStatusTimeline } from "@/components/concierge/ConciergeStatusTimeline";
import { PaymentReturnVerifier } from "@/components/payments/PaystackPayButton";
import { buildTxRef } from "@/lib/payments/config";
import { formatNaira } from "@/lib/data/home";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    payment?: string;
    reference?: string;
    trxref?: string;
    tx_ref?: string;
  }>;
};

export default async function ConciergeStatusDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const detail = await fetchClientConciergeDetail(id);
  if (!detail) notFound();

  const paid = detail.paymentStatus === "paid";
  const reference =
    query.reference ??
    query.trxref ??
    query.tx_ref ??
    (query.payment === "return" ? buildTxRef("concierge", id) : null);

  return (
    <div className="concierge-page mx-auto max-w-2xl px-4 py-8 sm:px-10 lg:py-12">
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-kay-subtle">
        <Link href="/" className="transition-colors hover:text-kay-fg">
          Home
        </Link>
        <span className="text-kay-border">/</span>
        <Link href="/concierge" className="transition-colors hover:text-kay-fg">
          Concierge
        </Link>
        <span className="text-kay-border">/</span>
        <span className="text-kay-fg">Status</span>
      </nav>

      <div className="mt-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kay-gold-light text-kay-gold">
          <span className="text-2xl">◇</span>
        </div>
        <p className="mt-6 text-[11px] uppercase tracking-[0.14em] text-kay-gold">
          Concierge sourcing
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-kay-fg sm:text-[36px]">
          {detail.productName}
        </h1>
        <p className="mt-3 text-[14px] text-kay-muted">
          Reference{" "}
          <span className="font-medium text-kay-fg">{detail.referenceNumber}</span>
          <span className="mx-2 text-kay-border">·</span>
          {CONCIERGE_STATUS_LABELS[detail.status]}
        </p>
        <p className="mt-1 text-[12px] text-kay-subtle">
          Submitted {formatConciergeDate(detail.createdAt)}
        </p>
      </div>

      <div className="mt-8">
        <ConciergeStatusTimeline status={detail.status} />
      </div>

      <ConciergeOfferResponse detail={detail} />
      {reference && !paid && <PaymentReturnVerifier reference={reference} />}
      <ConciergePaymentSection detail={detail} />

      <div className="mt-6 rounded-lg border border-kay-border-light bg-kay-surface-elevated/60 p-5 sm:p-6">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
          Request summary
        </h2>
        <dl className="mt-4 space-y-3 text-[14px]">
          {detail.brand && (
            <div className="flex justify-between gap-4">
              <dt className="text-kay-muted">Brand</dt>
              <dd className="text-right font-medium text-kay-fg">{detail.brand}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-kay-muted">Target budget</dt>
            <dd className="text-right font-medium text-kay-fg">
              {formatNaira(detail.budget)}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-8 text-center text-[13px] text-kay-muted">
        Questions about your request?{" "}
        <Link href="/contact" className="text-kay-gold hover:underline">
          Contact concierge
        </Link>{" "}
        or{" "}
        <Link href="/concierge/status" className="text-kay-gold hover:underline">
          track another request
        </Link>
        .
      </p>
    </div>
  );
}
