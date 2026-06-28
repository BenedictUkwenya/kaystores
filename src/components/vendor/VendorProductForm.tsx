"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types/product";

type Props = {
  product?: Product;
  canListAfterDark: boolean;
};

export function VendorProductForm({ product, canListAfterDark }: Props) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [imageUrl, setImageUrl] = useState(product?.images[0] ?? "");
  const [segment, setSegment] = useState<"gifting" | "after_dark">(
    (product?.segment as "gifting" | "after_dark") ?? "gifting",
  );
  const [inStock, setInStock] = useState(product?.in_stock ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent, submitForReview = false) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      sku,
      brand,
      description,
      price: Number(price),
      images: imageUrl ? [imageUrl] : [],
      segment: canListAfterDark ? segment : "gifting",
      inStock,
    };

    try {
      const url = isEdit
        ? `/api/vendor/products/${product!.id}`
        : "/api/vendor/products";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      if (submitForReview) {
        const submitRes = await fetch(
          `/api/vendor/products/${data.product?.id ?? product!.id}/submit`,
          { method: "POST" },
        );
        const submitData = await submitRes.json();
        if (!submitRes.ok) throw new Error(submitData.error ?? "Submit failed");
      }

      router.push("/vendor/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => handleSubmit(e, false)}
      className="space-y-5 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)] sm:p-8"
    >
      {product?.rejection_reason && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          Rejected: {product.rejection_reason}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Product name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
        <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} hint="URL-friendly ID" />
      </div>
      <Input
        label="Price (₦)"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <Input
        label="Image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        hint="Paste image URL or upload via Storage (coming soon)"
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        required
      />

      {canListAfterDark ? (
        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
            Catalogue segment
          </label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value as "gifting" | "after_dark")}
            className="h-11 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[13px]"
          >
            <option value="gifting">Luxury gifting</option>
            <option value="after_dark">After Dark (trusted vendors)</option>
          </select>
        </div>
      ) : (
        <p className="text-[12px] text-kay-muted">
          After Dark listings require trusted vendor status. Contact Kay admin to apply.
        </p>
      )}

      <label className="flex items-center gap-2 text-[13px] text-kay-fg">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          className="rounded border-kay-border"
        />
        In stock
      </label>

      {error && <p className="text-[13px] text-red-600">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Saving…" : "Save draft"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={(e) => handleSubmit(e, true)}
          className="w-full sm:w-auto"
        >
          Save & submit for review
        </Button>
      </div>
    </form>
  );
}
