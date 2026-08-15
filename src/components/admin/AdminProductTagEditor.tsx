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
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-kay-border px-3 text-[11px] font-medium text-kay-muted hover:border-kay-gold hover:text-kay-fg"
      >
        Badges
        {tags.length > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-kay-gold-light px-1 text-[9px] font-semibold text-kay-gold">
            {tags.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-[260px] rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-4 text-left shadow-[0_18px_50px_rgba(17,17,17,0.16)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-kay-subtle">
              Platform badges
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] text-kay-subtle hover:text-kay-fg"
            >
              Close
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
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
            className="mt-3 w-full"
          >
            {loading ? "Saving…" : "Save badges"}
          </Button>
          {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
