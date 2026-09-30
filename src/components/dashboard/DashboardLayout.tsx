"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import type { UserRole } from "@/types/dashboard";
import type { DashboardNavAttention } from "@/lib/dashboard/nav-attention";
import {
  NavAttention,
  useDashboardNavAttention,
} from "@/components/dashboard/DashboardNavAttention";
import {
  IconBag,
  IconChart,
  IconConcierge,
  IconHome,
  IconImport,
  IconOrders,
  IconPackage,
  IconPercent,
  IconSettings,
  IconStore,
  IconSupport,
  IconTag,
  IconUsers,
  IconWallet,
} from "@/components/ui/Icons";

export type DashboardNavIcon =
  | "home"
  | "users"
  | "orders"
  | "store"
  | "tag"
  | "import"
  | "percent"
  | "wallet"
  | "concierge"
  | "support"
  | "settings"
  | "chart"
  | "package"
  | "bag";

export type DashboardNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  attentionLabel?: string;
  icon?: DashboardNavIcon;
  group?: string;
  /** Extra path prefixes that should highlight this item (e.g. its job pages). */
  alsoActive?: string[];
};

type Props = {
  children: ReactNode;
  role: UserRole;
  nav: DashboardNavItem[];
  eyebrow: string;
  title: string;
  description?: string;
  badge?: string;
  actions?: ReactNode;
};

const NAV_ICONS: Record<
  DashboardNavIcon,
  ComponentType<{ className?: string }>
> = {
  home: IconHome,
  users: IconUsers,
  orders: IconOrders,
  store: IconStore,
  tag: IconTag,
  import: IconImport,
  percent: IconPercent,
  wallet: IconWallet,
  concierge: IconConcierge,
  support: IconSupport,
  settings: IconSettings,
  chart: IconChart,
  package: IconPackage,
  bag: IconBag,
};

function isActive(pathname: string, item: DashboardNavItem) {
  if (item.alsoActive?.some((prefix) => pathname.startsWith(prefix))) return true;
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavIcon({ name }: { name?: DashboardNavIcon }) {
  if (!name) return null;
  const Icon = NAV_ICONS[name];
  return <Icon className="h-[18px] w-[18px]" />;
}

function DashboardSidebar({
  nav,
  pathname,
  attention,
  role,
}: {
  nav: DashboardNavItem[];
  pathname: string;
  attention: DashboardNavAttention;
  role: UserRole;
}) {
  return (
    <aside className="hidden lg:sticky lg:top-6 lg:flex lg:h-[calc(100dvh-5.5rem)] lg:w-[248px] lg:shrink-0 lg:flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
        <div className="shrink-0 border-b border-kay-border-light px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
            {role === "admin" ? "Kay operations" : "Vendor studio"}
          </p>
          <p className="mt-1 font-serif text-[18px] leading-tight text-kay-fg">
            {role === "admin" ? "Command centre" : "Your boutique"}
          </p>
        </div>

        <nav
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3"
          aria-label="Dashboard navigation"
        >
          <ul className="space-y-1">
            {nav.map((item, index) => {
              const active = isActive(pathname, item);
              const showGroup =
                item.group && item.group !== nav[index - 1]?.group;
              return (
                <li key={item.href}>
                  {showGroup && (
                    <p
                      className={`px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-kay-subtle ${
                        index === 0 ? "" : "pt-3"
                      }`}
                    >
                      {item.group}
                    </p>
                  )}
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-[#111111] text-white shadow-sm"
                        : "text-kay-muted hover:bg-kay-surface hover:text-kay-fg"
                    }`}
                  >
                    <span
                      className={
                        active ? "text-kay-gold" : "text-kay-subtle"
                      }
                    >
                      <NavIcon name={item.icon} />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    <NavAttention
                      value={attention[item.href]}
                      active={active}
                      label={item.attentionLabel ?? `${item.label} need you`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-kay-border-light bg-[#111111] px-4 py-4 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
            White-glove standard
          </p>
          <p className="mt-1.5 font-serif text-[15px] leading-snug">
            Hub QC · discreet packaging · 72hr delivery
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex text-[12px] font-medium text-white/70 hover:text-kay-gold"
          >
            View storefront →
          </Link>
        </div>
      </div>
    </aside>
  );
}

function MobileNav({
  nav,
  pathname,
  attention,
}: {
  nav: DashboardNavItem[];
  pathname: string;
  attention: DashboardNavAttention;
}) {
  const primary = nav.slice(0, 5);
  const overflow = nav.slice(5);

  return (
    <div className="lg:hidden">
      <nav
        className="dashboard-nav-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        aria-label="Dashboard navigation"
      >
        {primary.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-medium transition-colors ${
                active
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-kay-border bg-kay-surface-elevated text-kay-muted"
              }`}
            >
              <span className={active ? "text-kay-gold" : undefined}>
                <NavIcon name={item.icon} />
              </span>
              {item.label}
              <NavAttention
                value={attention[item.href]}
                active={active}
                label={item.attentionLabel ?? `${item.label} need you`}
              />
            </Link>
          );
        })}
      </nav>
      {overflow.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {overflow.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                  active
                    ? "border-kay-fg bg-kay-fg text-kay-accent-fg"
                    : "border-kay-border-light bg-transparent text-kay-muted"
                }`}
              >
                {item.label}
                <NavAttention
                  value={attention[item.href]}
                  active={active}
                  label={item.attentionLabel ?? `${item.label} need you`}
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
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
  actions,
}: Props) {
  const pathname = usePathname();
  const attention = useDashboardNavAttention();
  const homeHref = role === "admin" ? "/admin" : "/vendor";
  const roleLabel =
    role === "admin"
      ? "Admin console"
      : role === "vendor"
        ? "Vendor portal"
        : "Dashboard";

  return (
    <div className="relative min-h-[70vh] overflow-hidden pb-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,_rgba(184,154,106,0.18),_transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1280px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-kay-border-light bg-kay-surface-elevated/90 px-4 py-3 shadow-[var(--kay-card-shadow)] backdrop-blur-sm">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={homeHref}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111111] text-[12px] font-semibold tracking-[0.08em] text-kay-gold"
            >
              K
            </Link>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-kay-fg">
                {roleLabel}
              </p>
              <p className="truncate text-[11px] text-kay-muted">
                Luxury gifting operations
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-kay-border px-3 py-1.5 text-[11px] font-medium text-kay-muted hover:border-kay-fg hover:text-kay-fg"
            >
              Storefront
            </Link>
            <Link
              href="/account"
              className="rounded-full border border-kay-border px-3 py-1.5 text-[11px] font-medium text-kay-muted hover:border-kay-fg hover:text-kay-fg"
            >
              Account
            </Link>
            {badge && (
              <span className="rounded-full border border-kay-gold/40 bg-kay-gold-light/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-gold">
                {badge}
              </span>
            )}
          </div>
        </div>

        <div className="lg:flex lg:items-start lg:gap-7">
          <DashboardSidebar
            nav={nav}
            pathname={pathname}
            attention={attention}
            role={role}
          />

          <div className="min-w-0 flex-1">
            <div className="mb-5 lg:hidden">
              <MobileNav nav={nav} pathname={pathname} attention={attention} />
            </div>

            <header className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-kay-gold">
                  {eyebrow}
                </p>
                <h1 className="mt-2 font-serif text-[30px] leading-[1.05] tracking-tight text-kay-fg sm:text-[36px] lg:text-[42px]">
                  {title}
                </h1>
                {description && (
                  <p className="mt-3 max-w-2xl text-[14px] leading-[1.7] text-kay-muted sm:text-[15px]">
                    {description}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {actions}
                </div>
              )}
            </header>

            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ADMIN_NAV: DashboardNavItem[] = [
  {
    href: "/admin",
    label: "Today",
    exact: true,
    icon: "home",
    group: "Work",
    attentionLabel: "jobs waiting on you",
  },
  {
    href: "/admin/gifts",
    label: "Gift orders",
    icon: "bag",
    group: "Work",
    alsoActive: ["/admin/jobs/gift"],
    attentionLabel: "gift orders waiting on you",
  },
  {
    href: "/admin/kitchen",
    label: "Kay Kitchen",
    icon: "package",
    group: "Work",
    alsoActive: ["/admin/jobs/kitchen"],
    attentionLabel: "kitchen requests waiting on you",
  },
  {
    href: "/admin/concierge",
    label: "Concierge",
    icon: "concierge",
    group: "Work",
    alsoActive: ["/admin/jobs/concierge"],
    attentionLabel: "concierge requests waiting on you",
  },
  {
    href: "/admin/support",
    label: "Messages",
    icon: "support",
    group: "Work",
    attentionLabel: "messages need a reply",
  },
  { href: "/admin/vendors", label: "Vendors", icon: "store", group: "People" },
  { href: "/admin/users", label: "Users", icon: "users", group: "People" },
  {
    href: "/admin/payouts",
    label: "Payouts",
    icon: "wallet",
    group: "Money",
    attentionLabel: "payouts to review",
  },
  { href: "/admin/pricing", label: "Kay's margin", icon: "percent", group: "Money" },
  { href: "/admin/products", label: "Products", exact: true, icon: "tag", group: "Catalogue" },
  { href: "/admin/products/import", label: "Import", icon: "import", group: "Catalogue" },
  { href: "/admin/hubs", label: "Hubs & shipping", icon: "settings", group: "Settings" },
];

export const VENDOR_NAV: DashboardNavItem[] = [
  {
    href: "/vendor",
    label: "Your jobs",
    exact: true,
    icon: "home",
    alsoActive: ["/vendor/jobs"],
    attentionLabel: "jobs to do",
  },
  { href: "/vendor/products", label: "Products", icon: "tag" },
  { href: "/vendor/wallet", label: "Wallet", icon: "wallet" },
  { href: "/vendor/settings", label: "Settings", icon: "settings" },
];
