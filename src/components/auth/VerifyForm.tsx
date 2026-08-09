"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OTPInput } from "@/components/auth/OTPInput";
import { KaySuspenseFallback } from "@/components/brand/KaySuspenseFallback";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { AUTH_OTP_LENGTH } from "@/lib/auth/otp";

const OTP_LENGTH = AUTH_OTP_LENGTH;

function VerifyFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const next = searchParams.get("next") ?? "/account";
  const type = (searchParams.get("type") ?? "signup") as
    | "signup"
    | "recovery"
    | "email";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }

    setError("");
    setLoading(true);

    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError("Auth is not configured.");
      setLoading(false);
      return;
    }

    const otpType = type === "recovery" ? "recovery" : "signup";

    const { error: authError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: otpType,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    await fetch("/api/auth/redeem-invites", { method: "POST" }).catch(
      () => null,
    );

    if (type === "recovery") {
      router.push("/reset-password");
    } else {
      router.push(next);
    }
    router.refresh();
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError("");

    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError("Auth is not configured.");
      setResending(false);
      return;
    }

    if (type === "recovery") {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email,
      );
      if (authError) setError(authError.message);
    } else {
      const { error: authError } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (authError) setError(authError.message);
    }

    setResending(false);
  }

  if (!email) {
    return (
      <div>
        <h1 className="font-serif text-[32px] text-kay-fg">Verify code</h1>
        <p className="mt-4 text-[14px] text-kay-muted">
          Missing email.{" "}
          <Link href="/login" className="text-kay-gold underline">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-[32px] text-kay-fg sm:text-[36px]">
        Verify code
      </h1>
      <p className="mt-2 text-[14px] text-kay-muted">
        Enter the code we just sent to{" "}
        <span className="font-medium text-kay-fg">{email}</span>
      </p>

      <form onSubmit={handleVerify} className="mt-8">
        <OTPInput
          length={OTP_LENGTH}
          value={code}
          onChange={setCode}
          disabled={loading}
        />

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-[13px] text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || code.length < OTP_LENGTH}
          className="mt-8 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-kay-accent text-[14px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify code"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-kay-muted">
        Didn&apos;t receive code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-medium text-kay-gold underline hover:opacity-80 disabled:opacity-50"
        >
          {resending ? "Sending…" : "Request new code"}
        </button>
      </p>
    </div>
  );
}

export function VerifyForm() {
  return (
    <Suspense fallback={<KaySuspenseFallback />}>
      <VerifyFormInner />
    </Suspense>
  );
}
