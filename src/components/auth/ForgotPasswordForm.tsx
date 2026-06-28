"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { AuthLinkRow } from "@/components/auth/AuthLinks";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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

    const trimmed = email.trim();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      trimmed,
    );

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(
      `/verify?email=${encodeURIComponent(trimmed)}&type=recovery`,
    );
  }

  return (
    <div>
      <h1 className="font-serif text-[32px] text-kay-fg sm:text-[36px]">
        Forgot password
      </h1>
      <p className="mt-2 text-[14px] text-kay-muted">
        Enter your email address to reset your password.
      </p>

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
          {loading ? "Sending…" : "Submit"}
        </button>
      </form>

      <AuthLinkRow
        left={{ text: "Remember password?", href: "/login", linkText: "Sign in" }}
      />
    </div>
  );
}
