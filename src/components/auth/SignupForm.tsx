"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AuthLinkRow } from "@/components/auth/AuthLinks";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError("Auth is not configured. Add Supabase keys to .env.local");
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }

    router.push(
      `/verify?email=${encodeURIComponent(email.trim())}&type=signup&next=${encodeURIComponent(next)}`,
    );
  }

  return (
    <div>
      <h1 className="font-serif text-[32px] text-kay-fg sm:text-[36px]">
        Create an account
      </h1>
      <p className="mt-2 text-[14px] text-kay-muted">
        Let&apos;s get you started.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          variant="checkout"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          required
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
          minLength={8}
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="mt-4">
        <Suspense fallback={null}>
          <GoogleSignInButton />
        </Suspense>
      </div>

      <AuthLinkRow
        left={{ text: "Already have an account?", href: "/login", linkText: "Sign in" }}
      />
    </div>
  );
}
