"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { AI_SUGGESTIONS } from "@/lib/data/home";
import { IconSparkle } from "@/components/ui/Icons";
import { AISuggestionResults } from "@/components/home/AISuggestionResults";
import { useTheme } from "@/providers/ThemeProvider";

export function AIConciergeSection() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<{
    message: string;
    products: Product[];
  } | null>(null);
  const { isAfterDark } = useTheme();

  async function runSuggest(prompt: string) {
    const q = prompt.trim();
    if (!q) return;

    setQuery(q);
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, afterDark: isAfterDark }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not get suggestions.");
      }

      const data = await res.json();
      setResults({ message: data.message, products: data.products });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSuggest(query);
  }

  return (
    <section id="ai-concierge" className="bg-kay-bg px-4 py-10 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="rounded-2xl bg-kay-surface px-6 py-8 lg:px-10 lg:py-10">
          <div className="lg:grid lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-10">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-[22px] text-kay-fg lg:text-[26px]">
                  Let Kay AI find the perfect gift
                </h2>
                <span className="rounded bg-kay-beta-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-kay-beta">
                  Beta
                </span>
              </div>
              <p className="mt-3 max-w-[320px] text-[14px] leading-relaxed text-kay-muted">
                Tell us about the person and the occasion, and we&apos;ll suggest
                something they&apos;ll love.
              </p>
              {isAfterDark && (
                <p className="mt-2 text-[12px] text-kay-gold">
                  After Dark — prioritising exclusive & night collection picks
                </p>
              )}
            </div>

            <div>
              <form onSubmit={handleSubmit}>
                <div className="flex overflow-hidden rounded-xl border border-kay-border bg-kay-input-bg shadow-sm">
                  <div className="flex flex-1 items-center gap-2 px-4">
                    <IconSparkle className="shrink-0 text-kay-subtle" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g. Gift for my sister who loves skincare, under ₦50,000"
                      className="h-12 w-full bg-transparent text-[14px] text-kay-fg outline-none placeholder:text-kay-subtle"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="shrink-0 bg-kay-accent px-6 text-[14px] font-medium text-kay-accent-fg transition-opacity hover:opacity-85 disabled:opacity-50"
                  >
                    {loading ? "Thinking…" : "Get Ideas"}
                  </button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {AI_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => runSuggest(suggestion)}
                    disabled={loading}
                    className="rounded-full border border-kay-border bg-kay-surface-elevated px-4 py-2 text-[12px] text-kay-muted transition-colors hover:border-kay-fg hover:text-kay-fg disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {error && (
                <p className="mt-4 text-[13px] text-red-600">{error}</p>
              )}

              {results && (
                <AISuggestionResults
                  message={results.message}
                  products={results.products}
                  onClose={() => setResults(null)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
