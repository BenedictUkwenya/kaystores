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

/** Count pill when there's a number of jobs waiting, pulsing dot otherwise. */
export function NavAttention({
  value,
  label,
  active,
}: {
  value: number | boolean | undefined;
  label: string;
  active?: boolean;
}) {
  if (typeof value === "number") {
    if (value <= 0) return null;
    return (
      <span
        className={`ml-2 inline-flex min-w-[20px] shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
          active ? "bg-kay-gold text-[#111111]" : "bg-[#111111] text-kay-gold"
        }`}
        aria-label={`${value} ${label}`}
        title={`${value} ${label}`}
      >
        {value > 99 ? "99+" : value}
      </span>
    );
  }
  return value ? <NavAttentionDot label={label} /> : null;
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
