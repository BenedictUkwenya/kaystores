import Link from "next/link";
import {
  IconArrowRight,
  IconBag,
  IconDiamond,
  IconLock,
  IconShield,
} from "@/components/ui/Icons";
import { AccountLayout } from "@/components/account/AccountLayout";

const BENEFITS = [
  "Order history and live delivery status in one place",
  "Faster checkout with saved details",
  "Priority access to concierge sourcing",
] as const;

export function AccountGuestView() {
  return (
    <AccountLayout
      eyebrow="Members"
      title="Your Kay account"
      description="Sign in to follow orders, manage gifting, and access our concierge team — or track a purchase privately, without an account."
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <div className="space-y-6">
          <div className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated/90 p-6 shadow-[var(--kay-card-shadow)] backdrop-blur-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kay-gold-light text-kay-gold">
                <IconShield className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-[22px] text-kay-fg">
                Member benefits
              </h2>
            </div>
            <ul className="mt-6 space-y-4">
              {BENEFITS.map((benefit) => (
                <li
                  key={benefit}
                  className="flex gap-3 text-[14px] leading-relaxed text-kay-muted"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-kay-gold" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#111111] p-6 text-white sm:p-8">
            <div className="flex items-center gap-2">
              <IconDiamond className="h-4 w-4 text-kay-gold" />
              <p className="font-serif text-[18px]">Prefer privacy?</p>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-white/70">
              Track any order with your reference and checkout email — no account
              required.
            </p>
            <Link
              href="/track-order"
              className="mt-5 inline-flex items-center gap-2 text-[13px] font-medium text-kay-gold transition-opacity hover:opacity-80"
            >
              Track a guest order
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)] sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-kay-gold/30 bg-kay-gold-light/50">
            <IconLock className="h-7 w-7 text-kay-gold" />
          </div>
          <h2 className="mt-6 text-center font-serif text-[28px] text-kay-fg">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-[14px] text-kay-muted">
            Sign in or create your account to continue.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/login?next=/account"
              className="inline-flex h-12 items-center justify-center rounded-full bg-kay-accent text-[14px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
            <Link
              href="/signup?next=/account"
              className="inline-flex h-12 items-center justify-center rounded-full border border-kay-fg text-[14px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
            >
              Create account
            </Link>
          </div>

          <Link
            href="/gifts"
            className="mt-6 flex items-center justify-center gap-2 text-[13px] text-kay-muted transition-colors hover:text-kay-fg"
          >
            <IconBag className="h-4 w-4" />
            Continue browsing gifts
          </Link>
        </div>
      </div>
    </AccountLayout>
  );
}
