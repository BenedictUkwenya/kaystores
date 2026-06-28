"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError("Auth is not configured.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/login?reset=success");
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-serif text-[32px] text-kay-fg sm:text-[36px]">
        Set new password
      </h1>
      <p className="mt-2 text-[14px] text-kay-muted">
        Enter a new password — must be at least eight characters.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          variant="checkout"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
          minLength={8}
        />
        <Input
          variant="checkout"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Enter password"
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
          {loading ? "Updating…" : "Submit"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-kay-muted">
        <Link href="/login" className="text-kay-fg underline hover:opacity-70">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
