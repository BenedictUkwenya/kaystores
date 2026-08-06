"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DashboardNavAttention } from "@/lib/dashboard/nav-attention";

const DashboardNavAttentionContext = createContext<DashboardNavAttention>({});

export function DashboardNavAttentionProvider({
  attention,
  children,
}: {
  attention: DashboardNavAttention;
  children: ReactNode;
}) {
  return (
    <DashboardNavAttentionContext.Provider value={attention}>
      {children}
    </DashboardNavAttentionContext.Provider>
  );
}

export function useDashboardNavAttention() {
  return useContext(DashboardNavAttentionContext);
}

export function NavAttentionDot({ label }: { label: string }) {
  return (
    <span
      className="relative ml-2 inline-flex h-2 w-2 shrink-0"
      aria-label={label}
      title={label}
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kay-gold opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-kay-gold shadow-[0_0_6px_rgba(184,154,106,0.9)]" />
    </span>
  );
}
