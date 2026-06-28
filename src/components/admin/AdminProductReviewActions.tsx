"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types/product";

type Props = { product: Product };

export function AdminProductReviewActions({ product }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function review(approved: boolean) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, rejectionReason: reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Review failed");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Review failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Rejection reason (if rejecting)"
        className="w-full rounded-lg border border-kay-border px-3 py-2 text-[13px]"
        rows={2}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" size="sm" disabled={loading} onClick={() => review(true)}>
          Approve
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={() => review(false)}>
          Reject
        </Button>
      </div>
    </div>
  );
}
