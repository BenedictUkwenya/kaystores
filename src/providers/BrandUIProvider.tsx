"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const SPLASH_KEY = "kay-splash-seen-v5";

type BrandUIContextValue = {
  /** True after the first-visit splash has finished (or was skipped). */
  splashDone: boolean;
  /** Global overlay loading (API waits, heavy actions). */
  isBusy: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
};

const BrandUIContext = createContext<BrandUIContextValue | null>(null);

export function BrandUIProvider({ children }: { children: ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SPLASH_KEY) === "1") {
        setSplashDone(true);
      }
    } catch {
      setSplashDone(true);
    }
  }, []);

  const completeSplash = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      /* ignore */
    }
    setSplashDone(true);
  }, []);

  // Expose completeSplash via custom event from SplashScreen — keep API small
  useEffect(() => {
    function onDone() {
      completeSplash();
    }
    window.addEventListener("kay:splash-done", onDone);
    return () => window.removeEventListener("kay:splash-done", onDone);
  }, [completeSplash]);

  const startLoading = useCallback(() => {
    setLoadingCount((c) => c + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((c) => Math.max(0, c - 1));
  }, []);

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>): Promise<T> => {
      startLoading();
      try {
        return await promise;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  const value = useMemo(
    () => ({
      splashDone,
      isBusy: loadingCount > 0,
      startLoading,
      stopLoading,
      withLoading,
    }),
    [splashDone, loadingCount, startLoading, stopLoading, withLoading],
  );

  return (
    <BrandUIContext.Provider value={value}>{children}</BrandUIContext.Provider>
  );
}

export function useBrandUI() {
  const ctx = useContext(BrandUIContext);
  if (!ctx) throw new Error("useBrandUI must be used within BrandUIProvider");
  return ctx;
}

/** Optional hook when provider may be absent (e.g. tests). */
export function useBrandUIOptional() {
  return useContext(BrandUIContext);
}

export function markSplashDone() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("kay:splash-done"));
  }
}
