"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import { MAX_COMPARE_PRODUCTS } from "@/types/compare";
import { loadCompare, saveCompare } from "@/lib/compare/storage";

type CompareContextValue = {
  products: Product[];
  slugs: string[];
  anchorSlug: string | null;
  isOpen: boolean;
  isLoading: boolean;
  canAddMore: boolean;
  openCompare: (options?: { anchorSlug?: string; slugs?: string[] }) => void;
  closeCompare: () => void;
  startCompareWith: (product: Product) => void;
  startCompareWithSlugs: (slugs: string[], anchorSlug?: string) => void;
  addProduct: (product: Product) => void;
  addProducts: (products: Product[]) => void;
  removeProduct: (slug: string) => void;
  clearCompare: () => void;
  isInCompare: (slug: string) => boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

async function fetchProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (slugs.length === 0) return [];
  const res = await fetch("/api/products/by-slugs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slugs }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { products: Product[] };
  return data.products ?? [];
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [anchorSlug, setAnchorSlug] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const hydrateProducts = useCallback(async (nextSlugs: string[]) => {
    if (nextSlugs.length === 0) {
      setProducts([]);
      return;
    }
    setIsLoading(true);
    const loaded = await fetchProductsBySlugs(nextSlugs);
    setProducts(loaded);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const saved = loadCompare();
    setSlugs(saved.slugs);
    setAnchorSlug(saved.anchorSlug);
    setHydrated(true);
    if (saved.slugs.length > 0) {
      void hydrateProducts(saved.slugs);
    }
  }, [hydrateProducts]);

  useEffect(() => {
    if (!hydrated) return;
    saveCompare({ slugs, anchorSlug });
  }, [slugs, anchorSlug, hydrated]);

  const openCompare = useCallback(
    (options?: { anchorSlug?: string; slugs?: string[] }) => {
      if (options?.slugs?.length) {
        const unique = [...new Set(options.slugs)].slice(0, MAX_COMPARE_PRODUCTS);
        setSlugs(unique);
        setAnchorSlug(options.anchorSlug ?? unique[0] ?? null);
        void hydrateProducts(unique);
      } else if (options?.anchorSlug) {
        setAnchorSlug(options.anchorSlug);
      }
      router.push("/compare");
    },
    [hydrateProducts, router],
  );

  const closeCompare = useCallback(() => {
    setIsOpen(false);
  }, []);

  const startCompareWith = useCallback(
    (product: Product) => {
      setSlugs([product.slug]);
      setAnchorSlug(product.slug);
      setProducts([product]);
      router.push("/compare");
    },
    [router],
  );

  const startCompareWithSlugs = useCallback(
    (nextSlugs: string[], nextAnchor?: string) => {
      const unique = [...new Set(nextSlugs)].slice(0, MAX_COMPARE_PRODUCTS);
      setSlugs(unique);
      setAnchorSlug(nextAnchor ?? unique[0] ?? null);
      void hydrateProducts(unique);
      router.push("/compare");
    },
    [hydrateProducts, router],
  );

  const addProduct = useCallback(
    (product: Product) => {
      setSlugs((prev) => {
        if (prev.includes(product.slug) || prev.length >= MAX_COMPARE_PRODUCTS) {
          return prev;
        }
        const next = [...prev, product.slug];
        setProducts((current) => {
          if (current.some((p) => p.slug === product.slug)) return current;
          return [...current, product];
        });
        if (!anchorSlug) setAnchorSlug(product.slug);
        return next;
      });
    },
    [anchorSlug],
  );

  const addProducts = useCallback((toAdd: Product[]) => {
    if (toAdd.length === 0) return;

    setSlugs((prev) => {
      const next = [...prev];
      for (const product of toAdd) {
        if (next.includes(product.slug) || next.length >= MAX_COMPARE_PRODUCTS) {
          continue;
        }
        next.push(product.slug);
      }
      return next;
    });

    setProducts((prev) => {
      const next = [...prev];
      for (const product of toAdd) {
        if (next.some((p) => p.slug === product.slug)) continue;
        next.push(product);
      }
      return next.slice(0, MAX_COMPARE_PRODUCTS);
    });

    setAnchorSlug((prev) => prev ?? toAdd[0]?.slug ?? null);
  }, []);

  const removeProduct = useCallback((slug: string) => {
    setSlugs((prev) => prev.filter((s) => s !== slug));
    setProducts((prev) => prev.filter((p) => p.slug !== slug));
    setAnchorSlug((prev) => (prev === slug ? null : prev));
  }, []);

  const clearCompare = useCallback(() => {
    setSlugs([]);
    setProducts([]);
    setAnchorSlug(null);
  }, []);

  const isInCompare = useCallback(
    (slug: string) => slugs.includes(slug),
    [slugs],
  );

  const value = useMemo(
    () => ({
      products,
      slugs,
      anchorSlug,
      isOpen,
      isLoading,
      canAddMore: slugs.length < MAX_COMPARE_PRODUCTS,
      openCompare,
      closeCompare,
      startCompareWith,
      startCompareWithSlugs,
      addProduct,
      addProducts,
      removeProduct,
      clearCompare,
      isInCompare,
    }),
    [
      products,
      slugs,
      anchorSlug,
      isOpen,
      isLoading,
      openCompare,
      closeCompare,
      startCompareWith,
      startCompareWithSlugs,
      addProduct,
      addProducts,
      removeProduct,
      clearCompare,
      isInCompare,
    ],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return ctx;
}
