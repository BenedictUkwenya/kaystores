"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AuthLinkRow } from "@/components/auth/AuthLinks";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/gifts";
  const resetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError("Auth is not configured. Add Supabase keys to .env.local");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-serif text-[32px] text-kay-fg sm:text-[36px]">
        Welcome back
      </h1>
      <p className="mt-2 text-[14px] text-kay-muted">
        Welcome back! Please enter your details.
      </p>

      {resetSuccess && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          Password updated. You can sign in now.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          variant="checkout"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          required
        />
        <Input
          variant="checkout"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-kay-accent text-[14px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>

      <div className="mt-4">
        <GoogleSignInButton label="Sign in with Google" />
      </div>

      <AuthLinkRow
        left={{ text: "Forgot password?", href: "/forgot-password", linkText: "Reset" }}
        right={{ text: "New here?", href: "/signup", linkText: "Sign up" }}
      />
    </div>
  );
}
