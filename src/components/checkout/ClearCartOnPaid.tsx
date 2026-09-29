"use client";

import { useEffect } from "react";
import { useCart } from "@/providers/CartProvider";

const KEY = "kay-cart-pending-order";

/** Remember which order the current bag was checked out as. */
export function markCartPendingOrder(orderId: string) {
  try {
    localStorage.setItem(KEY, orderId);
  } catch {
    // storage unavailable — bag just won't auto-clear
  }
}

/** Empties the bag once the order it became has been paid. */
export function ClearCartOnPaid({ orderId, paid }: { orderId: string; paid: boolean }) {
  const { clearCart } = useCart();

  useEffect(() => {
    if (!paid) return;
    try {
      if (localStorage.getItem(KEY) !== orderId) return;
      localStorage.removeItem(KEY);
    } catch {
      return;
    }
    clearCart();
  }, [orderId, paid, clearCart]);

  return null;
}
