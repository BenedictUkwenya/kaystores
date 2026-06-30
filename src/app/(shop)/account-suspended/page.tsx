import Link from "next/link";

export default function AccountSuspendedPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
        Account paused
      </p>
      <h1 className="mt-3 font-serif text-[28px] text-kay-fg">
        Your account is suspended
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-kay-muted">
        Access to Kay Stores is temporarily limited. If you believe this is a
        mistake, contact our team and we&apos;ll review your account.
      </p>
      <Link
        href="/contact"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-kay-accent px-8 text-[13px] font-medium text-kay-accent-fg"
      >
        Contact support
      </Link>
      <Link
        href="/login"
        className="mt-4 text-[13px] text-kay-muted hover:text-kay-fg"
      >
        Sign in with another account
      </Link>
    </div>
  );
}
