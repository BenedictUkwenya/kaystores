"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  kind: "order" | "concierge";
  id: string;
  email?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export function FlutterwavePayButton({
  kind,
  id,
  email,
  label = "Pay with Flutterwave",
  className,
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/flutterwave/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Could not start payment.");
      }
      if (data.link) {
        window.location.href = data.link;
        return;
      }
      throw new Error("Payment link was not returned.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Payment failed.");
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={pay}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? "Redirecting to Flutterwave…" : label}
    </Button>
  );
}

type ReturnProps = {
  txRef: string;
};

export function PaymentReturnVerifier({ txRef }: ReturnProps) {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          `/api/payments/flutterwave/initialize?tx_ref=${encodeURIComponent(txRef)}`,
        );
        const data = await res.json();
        if (cancelled) return;
        if (data.paid) {
          setMessage("Payment confirmed. Thank you!");
          router.refresh();
          return;
        }
        setMessage(
          "Payment not confirmed yet. If you completed payment, refresh in a moment.",
        );
      } catch {
        if (!cancelled) {
          setMessage(
            "Could not verify payment. Contact support if you were charged.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [txRef, router]);

  return (
    <p className="rounded-lg border border-kay-gold/30 bg-kay-gold-light/30 px-4 py-3 text-[13px] text-kay-fg">
      {message}
    </p>
  );
}
