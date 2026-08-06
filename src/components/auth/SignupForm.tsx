"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AuthLinkRow } from "@/components/auth/AuthLinks";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import {
  saveVendorApplyDraft,
  submitVendorApplicationRequest,
} from "@/lib/vendor/apply-draft";
import { isValidNin } from "@/lib/vendor/nin";

type SignupIntent = "customer" | "vendor";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const inviteToken = searchParams.get("invite") ?? "";
  const inviteRole = searchParams.get("role");
  const inviteMode =
    searchParams.get("mode") === "instant" ? "instant" : "profile";

  const isVendorInvite = Boolean(inviteToken && inviteRole === "vendor");
  const isAdminInvite = Boolean(inviteToken && inviteRole === "admin");
  const isRoleInvite = isVendorInvite || isAdminInvite;
  const isInstantInvite = isVendorInvite && inviteMode === "instant";
  const isProfileInvite = isVendorInvite && inviteMode === "profile";

  const initialIntent =
    searchParams.get("intent") === "vendor" || inviteRole === "vendor"
      ? "vendor"
      : "customer";

  const [intent, setIntent] = useState<SignupIntent>(
    inviteRole === "admin" || isVendorInvite ? "customer" : initialIntent,
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailLocked, setEmailLocked] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(isRoleInvite);
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [catalogDescription, setCatalogDescription] = useState("");
  const [nin, setNin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [vendorSuccess, setVendorSuccess] = useState<"pending" | "approved" | null>(
    null,
  );

  // Self-apply or profile-invite both collect vendor fields; instant does not.
  const isSelfVendorSignup =
    intent === "vendor" && inviteRole !== "admin" && !isVendorInvite;
  const showVendorFields = isSelfVendorSignup || isProfileInvite;

  useEffect(() => {
    if (!inviteToken) {
      setInviteLoading(false);
      return;
    }

    let cancelled = false;
    setInviteLoading(true);

    void (async () => {
      try {
        const res = await fetch(
          `/api/auth/invite-preview?token=${encodeURIComponent(inviteToken)}`,
        );
        const data = (await res.json()) as {
          email?: string;
          businessName?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "This invitation is invalid or expired.");
          setInviteLoading(false);
          return;
        }
        if (data.email) {
          setEmail(data.email);
          setEmailLocked(true);
        }
        if (data.businessName) {
          setBusinessName((prev) => prev || data.businessName!);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load invitation details.");
        }
      } finally {
        if (!cancelled) setInviteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (isRoleInvite && !emailLocked) {
      setError("Invitation details are still loading. Try again in a moment.");
      return;
    }

    if (showVendorFields) {
      if (!businessName.trim() || !contactPhone.trim() || !catalogDescription.trim()) {
        setError("Complete all vendor application fields.");
        return;
      }
    }

    if (isSelfVendorSignup && !isValidNin(nin)) {
      setError("Enter a valid 11-digit NIN.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError("Auth is not configured. Add Supabase keys to .env.local");
      setLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
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
      await fetch("/api/auth/redeem-invites", { method: "POST" });

      if (isInstantInvite) {
        router.push("/vendor");
        router.refresh();
        return;
      }

      if (showVendorFields) {
        try {
          const result = await submitVendorApplicationRequest({
            businessName: businessName.trim(),
            contactName: fullName.trim(),
            contactEmail: normalizedEmail,
            contactPhone: contactPhone.trim(),
            catalogDescription: catalogDescription.trim(),
            nin: isSelfVendorSignup ? nin.trim() : undefined,
            inviteToken: inviteToken || undefined,
          });
          if (result.status === "approved") {
            router.push("/vendor");
            router.refresh();
            return;
          }
          setVendorSuccess("pending");
          setLoading(false);
          return;
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Account created but application failed.",
          );
          setLoading(false);
          return;
        }
      }

      router.push(inviteRole === "admin" ? "/admin" : next);
      router.refresh();
      return;
    }

    if (showVendorFields) {
      saveVendorApplyDraft({
        businessName: businessName.trim(),
        contactName: fullName.trim(),
        contactEmail: normalizedEmail,
        contactPhone: contactPhone.trim(),
        catalogDescription: catalogDescription.trim(),
        nin: isSelfVendorSignup ? nin.trim() : undefined,
        inviteToken: inviteToken || undefined,
      });
    }

    const verifyNext = isInstantInvite
      ? "/vendor"
      : showVendorFields
        ? `/vendor/apply${inviteToken ? `?token=${encodeURIComponent(inviteToken)}` : ""}`
        : inviteRole === "admin"
          ? "/admin"
          : next;

    router.push(
      `/verify?email=${encodeURIComponent(normalizedEmail)}&type=signup&next=${encodeURIComponent(verifyNext)}`,
    );
  }

  if (vendorSuccess === "pending") {
    return (
      <div className="text-center">
        <h1 className="font-serif text-[32px] text-kay-fg sm:text-[36px]">
          Application submitted
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-kay-muted">
          Your account is ready and your vendor application is with our team.
          We&apos;ll email you when it&apos;s approved or if we need anything else.
        </p>
        <Link
          href="/account"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-8 text-[13px] font-medium"
        >
          Go to account
        </Link>
      </div>
    );
  }

  const title = inviteRole === "admin"
    ? "Join as admin"
    : isVendorInvite
      ? "Join as a Kay vendor"
      : isSelfVendorSignup
        ? "Apply as a vendor"
        : "Create an account";

  const subtitle = inviteRole === "admin"
    ? "Choose a name and password for your admin account."
    : isInstantInvite
      ? "Choose a name and password. Kay has already verified you — you'll go straight into the vendor portal."
      : isProfileInvite
        ? "Choose a name and password, then complete a short business profile. You'll be approved automatically."
        : isSelfVendorSignup
          ? "Create your account and submit your vendor application. Kay reviews every partner, including NIN verification."
          : "Shop gifts, track orders, and manage your Kay account.";

  return (
    <div>
      <h1 className="font-serif text-[32px] text-kay-fg sm:text-[36px]">
        {title}
      </h1>
      <p className="mt-2 text-[14px] text-kay-muted">{subtitle}</p>

      {inviteRole !== "admin" && !isVendorInvite && (
        <div className="mt-6 flex rounded-full border border-kay-border-light bg-kay-surface p-1">
          <button
            type="button"
            onClick={() => setIntent("customer")}
            className={`flex-1 rounded-full px-3 py-2 text-[13px] font-medium transition-colors ${
              intent === "customer"
                ? "bg-kay-fg text-kay-bg"
                : "text-kay-muted hover:text-kay-fg"
            }`}
          >
            Shop with Kay
          </button>
          <button
            type="button"
            onClick={() => setIntent("vendor")}
            className={`flex-1 rounded-full px-3 py-2 text-[13px] font-medium transition-colors ${
              intent === "vendor"
                ? "bg-kay-fg text-kay-bg"
                : "text-kay-muted hover:text-kay-fg"
            }`}
          >
            Apply as vendor
          </button>
        </div>
      )}

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
        {emailLocked ? (
          <div>
            <p className="mb-1.5 text-[12px] font-medium text-kay-muted">Email</p>
            <p className="rounded-lg border border-kay-border-light bg-kay-surface px-3.5 py-3 text-[14px] text-kay-fg">
              {email}
            </p>
            <p className="mt-1.5 text-[12px] text-kay-subtle">
              From your Kay invitation — this can&apos;t be changed.
            </p>
          </div>
        ) : (
          <Input
            variant="checkout"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              inviteLoading ? "Loading invitation…" : "Enter email address"
            }
            required
            disabled={inviteLoading}
          />
        )}
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

        {showVendorFields && (
          <div className="space-y-4 rounded-xl border border-kay-border-light bg-kay-surface/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kay-gold">
              {isProfileInvite ? "Business profile" : "Vendor application"}
            </p>
            <Input
              variant="checkout"
              label="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
            <Input
              variant="checkout"
              label="Phone"
              type="tel"
              autoComplete="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
            />
            {isSelfVendorSignup && (
              <Input
                variant="checkout"
                label="NIN"
                inputMode="numeric"
                autoComplete="off"
                value={nin}
                onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="11-digit National Identification Number"
                required
              />
            )}
            <Textarea
              label="What do you sell?"
              value={catalogDescription}
              onChange={(e) => setCatalogDescription(e.target.value)}
              rows={3}
              placeholder="Brands, categories, price range…"
              required
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || inviteLoading || (isRoleInvite && !emailLocked)}
          className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-kay-accent text-[14px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? showVendorFields
              ? "Submitting…"
              : "Creating account…"
            : isInstantInvite
              ? "Create account & enter portal"
              : isProfileInvite
                ? "Create account & continue"
                : isSelfVendorSignup
                  ? "Create account & apply"
                  : "Create account"}
        </button>
      </form>

      {!isRoleInvite && (
        <div className="mt-4">
          <Suspense fallback={null}>
            <GoogleSignInButton />
          </Suspense>
        </div>
      )}

      <AuthLinkRow
        left={{ text: "Already have an account?", href: "/login", linkText: "Sign in" }}
        right={
          !showVendorFields && !isVendorInvite
            ? {
                text: "Want to sell on Kay?",
                href: "/signup?intent=vendor",
                linkText: "Apply as vendor",
              }
            : undefined
        }
      />
    </div>
  );
}
