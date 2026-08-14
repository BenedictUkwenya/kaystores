"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { UserRole } from "@/types/dashboard";
import type { DashboardNavAttention } from "@/lib/dashboard/nav-attention";
import {
  NavAttentionDot,
  useDashboardNavAttention,
} from "@/components/dashboard/DashboardNavAttention";

export type DashboardNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  attentionLabel?: string;
};

type Props = {
  children: ReactNode;
  role: UserRole;
  nav: DashboardNavItem[];
  eyebrow: string;
  title: string;
  description?: string;
  badge?: string;
};

function DashboardNavPills({
  nav,
  pathname,
  attention,
}: {
  nav: DashboardNavItem[];
  pathname: string;
  attention: DashboardNavAttention;
}) {
  return (
    <nav
      className="dashboard-nav-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden"
      aria-label="Dashboard navigation"
    >
      {nav.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const needsAttention = attention[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex shrink-0 snap-start items-center rounded-full border px-4 py-2 text-[12px] font-medium transition-colors ${
              active
                ? "border-kay-fg bg-kay-fg text-kay-accent-fg"
                : "border-kay-border bg-kay-surface-elevated text-kay-muted hover:border-kay-fg/40 hover:text-kay-fg"
            }`}
          >
            {item.label}
            {needsAttention && (
              <NavAttentionDot
                label={item.attentionLabel ?? `${item.label} needs attention`}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function DashboardSidebar({
  nav,
  pathname,
  attention,
}: {
  nav: DashboardNavItem[];
  pathname: string;
  attention: DashboardNavAttention;
}) {
  return (
    <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
      <nav className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-2 shadow-[var(--kay-card-shadow)]">
        <ul className="space-y-0.5">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
            const needsAttention = attention[item.href];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-kay-surface text-kay-fg"
                      : "text-kay-muted hover:bg-kay-surface/60 hover:text-kay-fg"
                  }`}
                >
                  <span>{item.label}</span>
                  {needsAttention && (
                    <NavAttentionDot
                      label={item.attentionLabel ?? `${item.label} needs attention`}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-5 rounded-2xl bg-[#111111] p-5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
          Kay operations
        </p>
        <p className="mt-2 font-serif text-[18px] leading-snug">
          White-glove fulfilment
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-white/65">
          Hub vetting, discreet packaging, and 72-hour delivery standards.
        </p>
      </div>
    </aside>
  );
}

export function DashboardLayout({
  children,
  role,
  nav,
  eyebrow,
  title,
  description,
  badge,
}: Props) {
  const pathname = usePathname();
  const attention = useDashboardNavAttention();
  const homeHref = role === "admin" ? "/admin" : "/vendor";
  const roleLabel =
    role === "admin" ? "Admin console" : role === "vendor" ? "Vendor portal" : "Dashboard";

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-kay-gold-light/35 via-kay-surface/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-kay-gold/8 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1200px] px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pb-20 lg:pt-10">
        <nav className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-kay-subtle">
          <Link href="/" className="transition-colors hover:text-kay-fg">
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link href={homeHref} className="transition-colors hover:text-kay-fg">
            {roleLabel}
          </Link>
        </nav>

        <header className="mt-6 flex flex-wrap items-end justify-between gap-4 lg:mt-8">
          <div className="min-w-0 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-kay-gold">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-serif text-[28px] leading-[1.08] tracking-tight text-kay-fg sm:text-[34px] lg:text-[42px]">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-xl text-[14px] leading-[1.7] text-kay-muted sm:mt-4 sm:text-[15px]">
                {description}
              </p>
            )}
          </div>
          {badge && (
            <span className="rounded-full border border-kay-gold/40 bg-kay-gold-light/50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-gold">
              {badge}
            </span>
          )}
        </header>

        <div className="sticky top-[60px] z-30 -mx-4 mt-6 border-b border-kay-border-light/80 bg-kay-bg/95 px-4 py-3 backdrop-blur-sm lg:hidden">
          <DashboardNavPills nav={nav} pathname={pathname} attention={attention} />
        </div>

        <div className="mt-6 grid gap-6 lg:mt-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          <DashboardSidebar nav={nav} pathname={pathname} attention={attention} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

export const ADMIN_NAV: DashboardNavItem[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users" },
  {
    href: "/admin/orders",
    label: "Orders",
    attentionLabel: "Open orders need attention",
  },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/products", label: "Products", exact: true },
  { href: "/admin/products/import", label: "Import" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/payouts", label: "Payouts" },
  {
    href: "/admin/concierge",
    label: "Concierge",
    attentionLabel: "Concierge requests need attention",
  },
  {
    href: "/admin/support",
    label: "Support",
    attentionLabel: "Support messages need a reply",
  },
];

export const VENDOR_NAV: DashboardNavItem[] = [
  { href: "/vendor", label: "Overview", exact: true },
  { href: "/vendor/products", label: "Products" },
  {
    href: "/vendor/orders",
    label: "Orders",
    attentionLabel: "Open orders need fulfilment",
  },
  {
    href: "/vendor/concierge",
    label: "Concierge",
    attentionLabel: "Concierge requests need your response",
  },
  { href: "/vendor/wallet", label: "Wallet" },
  { href: "/vendor/settings", label: "Settings" },
];
