"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconSearch } from "@/components/ui/Icons";

type Props = {
  initialQuery?: string;
  basePath?: string;
  placeholder?: string;
  className?: string;
  inputId?: string;
  variant?: "light" | "dark";
  preserveParams?: Record<string, string | undefined>;
};

export function CatalogSearchForm({
  initialQuery = "",
  basePath = "/search",
  placeholder = "Search gifts…",
  className = "",
  inputId = "catalog-search",
  variant = "light",
  preserveParams,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (preserveParams) {
      Object.entries(preserveParams).forEach(([key, value]) => {
        if (value && key !== "q" && key !== "page") params.set(key, value);
      });
    }
    const q = query.trim();
    if (q) params.set("q", q);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  const isDark = variant === "dark";

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center overflow-hidden rounded-full border ${
        isDark
          ? "border-white/15 bg-white/5 focus-within:border-ad-amber/60"
          : "border-kay-border bg-kay-input-bg focus-within:border-kay-fg"
      } ${className}`}
    >
      <label htmlFor={inputId} className="sr-only">
        Search
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`h-11 min-w-0 flex-1 bg-transparent pl-4 pr-2 text-[13px] outline-none ${
          isDark
            ? "text-white placeholder:text-white/40"
            : "text-kay-fg placeholder:text-kay-subtle"
        }`}
      />
      <button
        type="submit"
        aria-label="Submit search"
        className={`flex h-11 w-11 shrink-0 items-center justify-center transition-opacity hover:opacity-70 ${
          isDark ? "text-ad-amber" : "text-kay-fg"
        }`}
      >
        <IconSearch className="h-4 w-4" />
      </button>
    </form>
  );
}
