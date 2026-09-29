"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AFTER_DARK_AGE_KEY } from "@/lib/after-dark/catalog";

type AfterDarkAgeContextValue = {
  verified: boolean;
  confirm: () => void;
  mounted: boolean;
};

const AfterDarkAgeContext = createContext<AfterDarkAgeContextValue | null>(null);

function safeAfterDarkNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (!raw.startsWith("/after-dark")) return null;
  return raw;
}

export function AfterDarkAgeProvider({
  children,
  initialVerified = false,
}: {
  children: React.ReactNode;
  initialVerified?: boolean;
}) {
  const [verified, setVerified] = useState(initialVerified);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    if (initialVerified) return;
    if (localStorage.getItem(AFTER_DARK_AGE_KEY) === "true") {
      void fetch("/api/after-dark/verify-age", { method: "POST" })
        .then((res) => {
          if (res.ok) {
            setVerified(true);
            router.refresh();
          }
        })
        .catch(() => undefined);
    }
  }, [initialVerified, router]);

  const confirm = useCallback(() => {
    const next = safeAfterDarkNext(searchParams.get("next"));
    void fetch("/api/after-dark/verify-age", { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("Could not verify age");
        localStorage.setItem(AFTER_DARK_AGE_KEY, "true");
        setVerified(true);
        router.refresh();
        if (next) router.replace(next);
      })
      .catch(() => {
        localStorage.setItem(AFTER_DARK_AGE_KEY, "true");
        setVerified(true);
        router.refresh();
        if (next) router.replace(next);
      });
  }, [router, searchParams]);

  return (
    <AfterDarkAgeContext.Provider value={{ verified, confirm, mounted }}>
      {children}
    </AfterDarkAgeContext.Provider>
  );
}

export function useAfterDarkAge() {
  const ctx = useContext(AfterDarkAgeContext);
  if (!ctx) {
    throw new Error("useAfterDarkAge must be used within AfterDarkAgeProvider");
  }
  return ctx;
}
