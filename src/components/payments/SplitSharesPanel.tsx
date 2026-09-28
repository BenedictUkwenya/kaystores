"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/data/home";

type ShareView = {
  id: string;
  index: number;
  amount: number;
  status: string;
  payerName: string | null;
  url: string;
};

type Props = {
  orderId: string;
  grandTotal: number;
  orderPaid: boolean;
  orderCancelled: boolean;
  expiresAt: string | null;
  organiserName: string;
  shares: ShareView[];
};

function timeLeft(expiresAt: string | null, now: number): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

const STATUS_LABEL: Record<string, string> = {
  unpaid: "Waiting",
  pending: "Paying…",
  paid: "Paid",
  void: "Closed",
  refund_due: "Refund due",
  refunded: "Refunded",
};

export function SplitSharesPanel({
  grandTotal,
  orderPaid,
  orderCancelled,
  expiresAt,
  organiserName,
  shares,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const paidCount = shares.filter((s) => s.status === "paid").length;
  const paidTotal = shares
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + s.amount, 0);
  const done = orderPaid || orderCancelled;

  useEffect(() => {
    setNow(Date.now());
    const tick = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (done) return;
    const poll = window.setInterval(() => router.refresh(), 8000);
    return () => window.clearInterval(poll);
  }, [done, router]);

  async function copy(share: ShareView) {
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(share.id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy this link", share.url);
    }
  }

  function whatsappHref(share: ShareView) {
    const text = `${organiserName} is putting together a gift on Kay Stores and your share is ${formatNaira(share.amount)}. Pay here: ${share.url}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  const progress = grandTotal > 0 ? Math.min(1, paidTotal / grandTotal) : 0;
  const remaining = now === null ? null : timeLeft(expiresAt, now);

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-kay-gold/40 bg-kay-gold-light/25 p-5">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[14px] text-kay-fg">
            <span className="font-semibold">{paidCount}</span> of {shares.length} paid
          </p>
          <p className="text-[13px] text-kay-muted">
            {formatNaira(paidTotal)} / {formatNaira(grandTotal)}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-kay-border-light">
          <div
            className="h-full rounded-full bg-kay-gold transition-[width] duration-700"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-3 text-[12px] text-kay-muted">
          {orderPaid
            ? "Everyone has paid — your order is confirmed."
            : orderCancelled
              ? "This split expired and the order was cancelled. Anyone who paid will be refunded."
              : remaining
                ? `${remaining} for everyone to pay. Your items are held until then.`
                : "Your items are held while everyone pays."}
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {shares.map((share) => {
          const paid = share.status === "paid";
          return (
            <li
              key={share.id}
              className={`rounded-xl border p-4 transition ${
                paid
                  ? "border-emerald-300/60 bg-emerald-50/60"
                  : "border-kay-border bg-kay-surface-elevated/60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium text-kay-fg">
                    {share.index === 1 ? "Your share" : `Person ${share.index}`}
                    {share.payerName ? ` · ${share.payerName}` : ""}
                  </p>
                  <p className="text-[13px] text-kay-muted">
                    {formatNaira(share.amount)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                    paid
                      ? "bg-emerald-100 text-emerald-800"
                      : share.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-kay-border-light text-kay-muted"
                  }`}
                >
                  {STATUS_LABEL[share.status] ?? share.status}
                </span>
              </div>
              {!paid && !done && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {share.index === 1 ? (
                    <a
                      href={share.url}
                      className="inline-flex h-9 items-center rounded-full bg-kay-gold px-4 text-[12px] font-semibold text-white transition hover:brightness-110"
                    >
                      Pay my share
                    </a>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void copy(share)}
                        className="inline-flex h-9 items-center rounded-full border border-kay-fg px-4 text-[12px] font-medium text-kay-fg transition hover:bg-kay-surface"
                      >
                        {copied === share.id ? "Copied ✓" : "Copy link"}
                      </button>
                      <a
                        href={whatsappHref(share)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-full bg-[#25D366] px-4 text-[12px] font-semibold text-white transition hover:brightness-105"
                      >
                        Send on WhatsApp
                      </a>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
