"use client";

import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/providers/CartProvider";
import { hasAfterDarkItems } from "@/lib/after-dark/checkout-privacy";
import { AFTER_DARK_AGE_KEY } from "@/lib/after-dark/catalog";

/**
 * If the bag has After Dark lines but the shopper never confirmed 18+
 * (cookie + local mirror), block checkout until they do.
 */
export function AfterDarkCheckoutAgeGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { items } = useCart();
  const needsGate = hasAfterDarkItems(items);
  const [allowed, setAllowed] = useState(!needsGate);
  const [checking, setChecking] = useState(needsGate);

  useEffect(() => {
    if (!needsGate) {
      setAllowed(true);
      setChecking(false);
      return;
    }
    const localOk = localStorage.getItem(AFTER_DARK_AGE_KEY) === "true";
    if (localOk) {
      void fetch("/api/after-dark/verify-age", { method: "POST" }).finally(() => {
        setAllowed(true);
        setChecking(false);
      });
      return;
    }
    setAllowed(false);
    setChecking(false);
  }, [needsGate]);

  const confirm = useCallback(() => {
    void fetch("/api/after-dark/verify-age", { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("verify failed");
        localStorage.setItem(AFTER_DARK_AGE_KEY, "true");
        setAllowed(true);
      })
      .catch(() => {
        localStorage.setItem(AFTER_DARK_AGE_KEY, "true");
        setAllowed(true);
      });
  }, []);

  if (!needsGate || allowed) return <>{children}</>;

  if (checking) {
    return (
      <div className="rounded-xl border border-kay-border-light bg-kay-surface px-6 py-10 text-center text-[14px] text-kay-muted">
        Checking age verification…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-kay-border bg-kay-surface px-6 py-10 text-center">
      <h2 className="font-serif text-[24px] text-kay-fg">Confirm you are 18+</h2>
      <p className="mt-3 text-[14px] leading-relaxed text-kay-muted">
        Your bag includes After Dark items. Please confirm you are 18 or older to
        continue checkout.
      </p>
      <button
        type="button"
        onClick={confirm}
        className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-kay-accent text-[14px] font-medium text-kay-accent-fg"
      >
        I am 18 or older
      </button>
    </div>
  );
}
