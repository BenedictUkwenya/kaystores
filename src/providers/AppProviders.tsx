"use client";

import { ThemeProvider } from "@/providers/ThemeProvider";
import { CartProvider } from "@/providers/CartProvider";
import { CompareProvider } from "@/providers/CompareProvider";
import { BrandUIProvider, useBrandUI } from "@/providers/BrandUIProvider";
import { KaySplashScreen } from "@/components/brand/KaySplashScreen";
import { KayLoadingOverlay } from "@/components/brand/KayLoader";
import { CartShell } from "@/components/cart/CartShell";

function BrandUIChrome({ children }: { children: React.ReactNode }) {
  const { isBusy } = useBrandUI();
  return (
    <>
      <KaySplashScreen />
      <KayLoadingOverlay show={isBusy} />
      {children}
    </>
  );
}

/**
 * Single client boundary for all app providers so context stays intact
 * across SSR / streaming (avoids “useCart must be used within CartProvider”).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        <CompareProvider>
          <BrandUIProvider>
            <BrandUIChrome>
              {children}
              <CartShell />
            </BrandUIChrome>
          </BrandUIProvider>
        </CompareProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
