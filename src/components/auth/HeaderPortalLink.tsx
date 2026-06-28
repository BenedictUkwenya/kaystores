"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { UserRole } from "@/types/dashboard";

const PORTAL_CONFIG: Partial<
  Record<UserRole, { href: string; label: string }>
> = {
  admin: { href: "/admin", label: "Admin" },
  vendor: { href: "/vendor", label: "Vendor" },
};

export function HeaderPortalLink({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const [portals, setPortals] = useState<{ href: string; label: string }[]>(
    [],
  );

  useEffect(() => {
    const client = createBrowserSupabase();
    if (!client) return;

    const sb = client;

    async function loadRole() {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        setPortals([]);
        return;
      }

      const { data: profile } = await sb
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = (profile?.role as UserRole) ?? "customer";
      const portal = PORTAL_CONFIG[role];
      setPortals(portal ? [portal] : []);
    }

    loadRole();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(() => {
      loadRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (portals.length === 0) return null;

  const pillClass =
    variant === "dark"
      ? "inline-flex h-9 shrink-0 items-center rounded-full border border-ad-amber/40 bg-ad-amber/10 px-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ad-amber transition-colors hover:border-ad-amber hover:bg-ad-amber/20"
      : "inline-flex h-9 shrink-0 items-center rounded-full border border-kay-gold/35 bg-kay-gold-light/50 px-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-gold transition-colors hover:border-kay-gold hover:bg-kay-gold-light/80";

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {portals.map((portal) => (
        <Link key={portal.href} href={portal.href} className={pillClass}>
          {portal.label}
        </Link>
      ))}
    </div>
  );
}
