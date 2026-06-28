"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconUser } from "@/components/ui/Icons";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function HeaderAccountLink() {
  const [href, setHref] = useState("/login");

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setHref(data.user ? "/account" : "/login");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHref(session?.user ? "/account" : "/login");
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Link
      href={href}
      aria-label="Account"
      className="hidden h-10 w-10 items-center justify-center text-kay-fg transition-opacity hover:opacity-60 sm:flex"
    >
      <IconUser />
    </Link>
  );
}
