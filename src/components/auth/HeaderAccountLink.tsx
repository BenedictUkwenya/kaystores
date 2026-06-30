"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconUser } from "@/components/ui/Icons";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Props = {
  variant?: "light" | "dark";
};

export function HeaderAccountLink({ variant = "light" }: Props) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const client = createBrowserSupabase();
    if (!client) {
      setSignedIn(false);
      return;
    }

    client.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (signedIn === null) {
    return (
      <span
        className="inline-block h-9 w-[4.5rem] shrink-0"
        aria-hidden
      />
    );
  }

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className={
          variant === "dark"
            ? "inline-flex h-9 shrink-0 items-center rounded-full border border-white/25 px-3.5 text-[11px] font-medium tracking-wide text-white/90 transition-colors hover:border-ad-amber hover:text-ad-amber"
            : "inline-flex h-9 shrink-0 items-center rounded-full border border-kay-fg px-3.5 text-[11px] font-medium tracking-wide text-kay-fg transition-opacity hover:opacity-70"
        }
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      aria-label="Account"
      className={
        variant === "dark"
          ? "flex h-9 w-9 shrink-0 items-center justify-center text-white/70 transition-colors hover:text-ad-amber"
          : "flex h-10 w-10 shrink-0 items-center justify-center text-kay-fg transition-opacity hover:opacity-60"
      }
    >
      <IconUser />
    </Link>
  );
}
