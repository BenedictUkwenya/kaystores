"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "standard" | "after-dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isAfterDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "kay-theme";

function applyThemeAttr(theme: Theme) {
  if (theme === "after-dark") {
    document.documentElement.setAttribute("data-theme", "after-dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function withThemeTransition(apply: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };

  document.documentElement.classList.add("theme-switching");

  if (typeof doc.startViewTransition === "function") {
    const transition = doc.startViewTransition(apply);
    transition.finished.finally(() => {
      document.documentElement.classList.remove("theme-switching");
    });
    return;
  }

  apply();
  window.setTimeout(() => {
    document.documentElement.classList.remove("theme-switching");
  }, 500);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("standard");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme = stored === "after-dark" ? "after-dark" : "standard";
    setThemeState(initial);
    applyThemeAttr(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyThemeAttr(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = useCallback((next: Theme) => {
    withThemeTransition(() => {
      applyThemeAttr(next);
      setThemeState(next);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    withThemeTransition(() => {
      setThemeState((prev) => {
        const next = prev === "standard" ? "after-dark" : "standard";
        applyThemeAttr(next);
        return next;
      });
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isAfterDark: theme === "after-dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
