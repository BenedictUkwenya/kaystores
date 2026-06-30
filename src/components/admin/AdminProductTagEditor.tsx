"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_TAGS } from "@/lib/shop/taxonomy";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/Button";

type Props = {
  product: Product;
};

export function AdminProductTagEditor({ product }: Props) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(product.tags ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(slug: string) {
    setTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug],
    );
  }

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 border-t border-kay-border-light pt-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-kay-subtle">
        Platform badges
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PLATFORM_TAGS.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => toggle(t.slug)}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              tags.includes(t.slug)
                ? "border-kay-fg bg-kay-fg text-kay-accent-fg"
                : "border-kay-border text-kay-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={loading}
        onClick={save}
        className="mt-2"
      >
        {loading ? "Saving…" : "Save badges"}
      </Button>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
