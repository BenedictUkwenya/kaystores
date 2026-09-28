import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getShareByToken,
  getShareOrderSummary,
  isSplitExpired,
  listSharesForOrder,
} from "@/lib/payments/shares";
import { buildTxRef, isPaystackConfigured } from "@/lib/payments/config";
import { formatNaira } from "@/lib/data/home";
import { PaymentReturnVerifier } from "@/components/payments/PaystackPayButton";
import { SharePayForm } from "@/components/payments/SharePayForm";
import { IconGift } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chip in for a gift",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ payment?: string; reference?: string; trxref?: string }>;
};

export default async function SplitSharePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const query = await searchParams;
  const share = await getShareByToken(token);
  if (!share) notFound();

  const summary = await getShareOrderSummary(share.orderId);
  if (!summary) notFound();

  const shares = await listSharesForOrder(share.orderId);
  const paidCount = shares.filter((s) => s.status === "paid").length;
  const paid = share.status === "paid";
  const cancelled = summary.status === "cancelled";
  const expired = isSplitExpired(summary);
  const orderPaid = summary.paymentStatus === "paid";
  const open = !paid && !cancelled && !expired && !orderPaid;
  const reference =
    query.reference ??
    query.trxref ??
    (query.payment === "return" ? buildTxRef("share", share.id) : null);

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-8 lg:py-16">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kay-surface text-kay-gold">
          <IconGift className="h-6 w-6" />
        </div>
        <p className="mt-6 text-[11px] uppercase tracking-[0.14em] text-kay-gold">
          {paid ? "Thank you" : "Chip in for a gift"}
        </p>
        <h1 className="mt-2 font-serif text-[30px] leading-tight text-kay-fg sm:text-[34px]">
          {paid
            ? "Your share is paid"
            : `${summary.organiserFirstName} invited you to share a gift`}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-kay-muted">
          {summary.itemCount} {summary.itemCount === 1 ? "item" : "items"} ·{" "}
          {formatNaira(summary.grandTotal)} total, split {shares.length} ways.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-kay-gold/40 bg-kay-gold-light/25 p-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.14em] text-kay-subtle">
          Your share
        </p>
        <p className="mt-1 font-serif text-[40px] text-kay-fg">
          {formatNaira(share.amount)}
        </p>
        <div className="mx-auto mt-4 flex max-w-xs justify-center gap-1.5">
          {shares.map((s) => (
            <span
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${
                s.status === "paid" ? "bg-kay-gold" : "bg-kay-border-light"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-[12px] text-kay-muted">
          {paidCount} of {shares.length} paid
        </p>
      </div>

      {reference && !paid && (
        <div className="mt-6">
          <PaymentReturnVerifier reference={reference} />
        </div>
      )}

      {open && isPaystackConfigured() && (
        <SharePayForm
          token={share.token}
          amountLabel={formatNaira(share.amount)}
          defaultName={share.payerName ?? ""}
          defaultEmail={share.payerEmail ?? ""}
          expiresAt={summary.splitExpiresAt}
        />
      )}

      {!open && !paid && (
        <p className="mt-6 rounded-lg border border-kay-border bg-kay-surface px-4 py-3 text-center text-[13px] text-kay-muted">
          {orderPaid
            ? "This gift is already fully paid — nothing more to do."
            : "This split link has expired. Nothing was charged to you."}
        </p>
      )}

      {paid && (
        <p className="mt-6 text-center text-[13px] leading-relaxed text-kay-muted">
          We&apos;ll let {summary.organiserFirstName} know. The gift ships as soon
          as everyone has paid.
        </p>
      )}
    </div>
  );
}
