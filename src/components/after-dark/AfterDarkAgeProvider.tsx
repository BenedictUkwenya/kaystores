"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AFTER_DARK_AGE_KEY } from "@/lib/after-dark/catalog";

type AfterDarkAgeContextValue = {
  verified: boolean;
  confirm: () => void;
  mounted: boolean;
};

const AfterDarkAgeContext = createContext<AfterDarkAgeContextValue | null>(null);

export function AfterDarkAgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [verified, setVerified] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setVerified(localStorage.getItem(AFTER_DARK_AGE_KEY) === "true");
    setMounted(true);
  }, []);

  const confirm = useCallback(() => {
    localStorage.setItem(AFTER_DARK_AGE_KEY, "true");
    setVerified(true);
  }, []);

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
