"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  productId: string;
  productName: string;
};

export function AdminProductActions({ productId, productName }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${productName}" permanently? This removes it from the shop catalogue.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete product.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete product.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href={`/admin/products/${productId}/edit`}
          className="inline-flex h-8 items-center rounded-full border border-kay-border px-3 text-[11px] font-medium text-kay-fg hover:border-kay-fg"
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={deleting}
          onClick={() => void handleDelete()}
          className="inline-flex h-8 items-center rounded-full border border-red-200 px-3 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
