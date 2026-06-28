"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

export function AccountPanel() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <p className="text-kay-muted">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-serif text-[28px] text-kay-fg">Your account</h1>
        <p className="mt-3 text-[14px] text-kay-muted">
          Sign in to track orders and save your preferences.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full bg-kay-accent px-8 text-[14px] font-medium text-kay-accent-fg"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-8 text-[14px] font-medium text-kay-fg"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Guest";

  return (
    <div className="mx-auto max-w-lg px-6 py-10 sm:py-14">
      <h1 className="font-serif text-[32px] text-kay-fg">Hello, {name}</h1>
      <p className="mt-2 text-[14px] text-kay-muted">{user.email}</p>

      <div className="mt-8 rounded-xl border border-kay-border-light bg-kay-surface-elevated p-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-kay-subtle">
          Account
        </h2>
        <ul className="mt-4 space-y-3 text-[14px]">
          <li>
            <Link href="/gifts" className="text-kay-fg hover:opacity-70">
              Continue shopping
            </Link>
          </li>
          <li>
            <Link href="/concierge" className="text-kay-fg hover:opacity-70">
              Concierge sourcing
            </Link>
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-8 h-11 w-full rounded-lg border border-kay-border text-[14px] font-medium text-kay-fg transition-colors hover:border-kay-fg hover:bg-kay-surface sm:w-auto sm:px-8"
      >
        Sign out
      </button>
    </div>
  );
}
