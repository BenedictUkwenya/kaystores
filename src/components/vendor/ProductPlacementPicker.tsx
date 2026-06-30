"use client";

import Link from "next/link";
import { useState } from "react";
import {
  COLLECTIONS,
  getPlacementPreviewPaths,
  hasAnyPlacement,
  OCCASIONS,
  RECIPIENTS,
} from "@/lib/shop/taxonomy";
import { Button } from "@/components/ui/Button";

type PlacementState = {
  occasions: string[];
  recipients: string[];
  collections: string[];
};

type Props = {
  value: PlacementState;
  onChange: (value: PlacementState) => void;
  publishMode?: boolean;
  productName?: string;
  productDescription?: string;
  productBrand?: string;
  productPrice?: number;
};

function FilterPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-[12px] leading-none transition-all duration-200 ${
        selected
          ? "border-kay-fg bg-kay-fg text-kay-accent-fg"
          : "border-kay-border bg-transparent text-kay-muted hover:border-kay-fg/40 hover:text-kay-fg"
      }`}
    >
      {label}
    </button>
  );
}

function toggleInList(list: string[], slug: string): string[] {
  return list.includes(slug)
    ? list.filter((s) => s !== slug)
    : [...list, slug];
}

export function ProductPlacementPicker({
  value,
  onChange,
  publishMode = false,
  productName = "",
  productDescription = "",
  productBrand = "",
  productPrice = 0,
}: Props) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestNote, setSuggestNote] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const previewPaths = getPlacementPreviewPaths(value);
  const placementOk = hasAnyPlacement(value);
  const canSuggest =
    productName.trim().length > 0 && productDescription.trim().length > 2;

  async function handleSuggest() {
    if (!canSuggest) return;
    setSuggesting(true);
    setSuggestError(null);
    setSuggestNote(null);
    try {
      const res = await fetch("/api/ai/suggest-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          description: productDescription,
          brand: productBrand,
          price: productPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Suggestion failed");
      onChange({
        occasions: data.occasions ?? [],
        recipients: data.recipients ?? [],
        collections: data.collections ?? [],
      });
      setSuggestNote(
        data.mode === "llm"
          ? "AI suggestions applied — review before publishing."
          : "Keyword suggestions applied — review before publishing.",
      );
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Suggestion failed");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="rounded-xl border border-kay-border-light bg-kay-surface/40 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
            Where should this appear?
          </p>
          <p className="mt-1 text-[12px] text-kay-muted">
            Pick all that apply — your gift can show in multiple shop categories.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canSuggest || suggesting}
          onClick={handleSuggest}
          className="shrink-0"
        >
          {suggesting ? "Suggesting…" : "Suggest categories"}
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[12px] font-medium text-kay-fg">Occasions</p>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <FilterPill
                key={o.slug}
                label={o.label}
                selected={value.occasions.includes(o.slug)}
                onClick={() =>
                  onChange({
                    ...value,
                    occasions: toggleInList(value.occasions, o.slug),
                  })
                }
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-medium text-kay-fg">Recipients</p>
          <div className="flex flex-wrap gap-2">
            {RECIPIENTS.map((r) => (
              <FilterPill
                key={r.slug}
                label={r.label}
                selected={value.recipients.includes(r.slug)}
                onClick={() =>
                  onChange({
                    ...value,
                    recipients: toggleInList(value.recipients, r.slug),
                  })
                }
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-medium text-kay-fg">Collections</p>
          <div className="flex flex-wrap gap-2">
            {COLLECTIONS.map((c) => (
              <FilterPill
                key={c.slug}
                label={c.label}
                selected={value.collections.includes(c.slug)}
                onClick={() =>
                  onChange({
                    ...value,
                    collections: toggleInList(value.collections, c.slug),
                  })
                }
              />
            ))}
          </div>
        </div>
      </div>

      {publishMode && !placementOk && (
        <p className="mt-3 text-[12px] text-amber-800">
          Choose at least one occasion, recipient, or collection to publish.
        </p>
      )}

      {suggestNote && (
        <p className="mt-3 text-[12px] text-kay-muted">{suggestNote}</p>
      )}
      {suggestError && (
        <p className="mt-3 text-[12px] text-red-600">{suggestError}</p>
      )}

      {previewPaths.length > 0 && (
        <div className="mt-4 rounded-lg border border-kay-border-light bg-kay-surface-elevated px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-kay-subtle">
            Shop pages
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {previewPaths.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-kay-gold hover:underline"
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
