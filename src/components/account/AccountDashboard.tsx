import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { OrderSummary } from "@/types/order";
import type { ClientConciergeStatus } from "@/types/concierge";
import type { Vendor } from "@/types/dashboard";
import { formatNaira } from "@/lib/data/home";
import { AccountLayout } from "@/components/account/AccountLayout";
import { AccountOrders } from "@/components/account/AccountOrders";
import { AccountConciergeRequests } from "@/components/account/AccountConciergeRequests";
import {
  formatMemberSince,
  getInitials,
} from "@/components/account/account-utils";
import {
  IconArrowRight,
  IconBag,
  IconDiamond,
  IconShield,
} from "@/components/ui/Icons";

type Props = {
  user: User;
  orders: OrderSummary[];
  conciergeRequests: ClientConciergeStatus[];
  vendorApplication: Vendor | null;
  onSignOut: () => void;
};

const SERVICES = [
  {
    href: "/concierge",
    label: "New request",
    description: "Source rare & bespoke pieces",
    icon: IconDiamond,
  },
  {
    href: "/concierge/status",
    label: "Track concierge",
    description: "Reference + email lookup",
    icon: IconShield,
  },
  {
    href: "/track-order",
    label: "Track order",
    description: "Reference + email lookup",
    icon: IconShield,
  },
  {
    href: "/gifts",
    label: "Shop gifts",
    description: "Curated luxury collections",
    icon: IconBag,
  },
] as const;

export function AccountDashboard({
  user,
  orders,
  conciergeRequests,
  vendorApplication,
  onSignOut,
}: Props) {
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Guest";
  const firstName = name.split(/\s+/)[0] ?? name;
  const memberSince = user.created_at
    ? formatMemberSince(user.created_at)
    : null;
  const totalSpent = orders.reduce(
    (sum, order) => sum + order.pricing.grandTotal,
    0,
  );

  const pendingVendor = vendorApplication?.status === "pending";
  const rejectedVendor = vendorApplication?.status === "rejected";
  const approvedVendor = vendorApplication?.status === "approved";

  const serviceLinks = pendingVendor
    ? [
        {
          href: "/vendor/apply",
          label: "Application status",
          description: "Pending Kay review",
          icon: IconShield,
        },
        ...SERVICES,
      ]
    : approvedVendor
      ? [
          {
            href: "/vendor",
            label: "Vendor portal",
            description: "Catalogue, orders & wallet",
            icon: IconBag,
          },
          ...SERVICES,
        ]
      : [
          {
            href: "/vendor/apply",
            label: "Become a vendor",
            description: "Apply to sell with Kay",
            icon: IconBag,
          },
          ...SERVICES,
        ];

  return (
    <AccountLayout
      title={`Welcome back, ${firstName}`}
      description="Your orders, gifting activity, and concierge requests — managed with the same care we put into every delivery."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <div className="space-y-8">
          {vendorApplication &&
            (pendingVendor || rejectedVendor || approvedVendor) && (
              <section
                className={`rounded-2xl border px-5 py-5 sm:px-6 ${
                  pendingVendor
                    ? "border-amber-200/80 bg-amber-50/70"
                    : rejectedVendor
                      ? "border-red-200/80 bg-red-50/70"
                      : "border-kay-gold/30 bg-kay-gold-light/40"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
                  Vendor application
                </p>
                <p className="mt-2 font-serif text-[22px] text-kay-fg">
                  {pendingVendor
                    ? "Under review"
                    : rejectedVendor
                      ? "Not approved"
                      : "Approved partner"}
                </p>
                <p className="mt-1 text-[13px] text-kay-muted">
                  {vendorApplication.businessName}
                  {pendingVendor
                    ? " — Kay is reviewing your application."
                    : rejectedVendor
                      ? " — you can update details and apply again."
                      : " — your vendor portal is ready."}
                </p>
                <Link
                  href={approvedVendor ? "/vendor" : "/vendor/apply"}
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-kay-fg px-5 text-[12px] font-medium text-kay-fg transition-colors hover:bg-kay-surface"
                >
                  {approvedVendor
                    ? "Open vendor portal"
                    : pendingVendor
                      ? "View application status"
                      : "View application"}
                </Link>
              </section>
            )}

          <section className="overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
            <div className="border-b border-kay-border-light bg-gradient-to-r from-kay-surface via-kay-surface-elevated to-kay-gold-light/25 px-6 py-6 sm:px-8">
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border border-kay-gold/35 bg-kay-gold-light/60 font-serif text-[26px] text-kay-fg">
                  {getInitials(name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[24px] text-kay-fg sm:text-[28px]">
                    {name}
                  </p>
                  <p className="mt-1 truncate text-[14px] text-kay-muted">
                    {user.email}
                  </p>
                  {memberSince && (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-kay-gold">
                      Member since {memberSince}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="shrink-0 rounded-full border border-kay-border px-5 py-2.5 text-[13px] font-medium text-kay-muted transition-colors hover:border-kay-fg hover:text-kay-fg"
                >
                  Sign out
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y border-kay-border-light min-[420px]:grid-cols-3 min-[420px]:divide-x min-[420px]:divide-y-0">
              <StatCell label="Orders" value={String(orders.length)} />
              <StatCell
                label="Lifetime value"
                value={orders.length > 0 ? formatNaira(totalSpent) : "—"}
              />
              <StatCell label="Status" value="Active" accent />
            </div>
          </section>

          <AccountConciergeRequests requests={conciergeRequests} />

          <AccountOrders orders={orders} />
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
              Services
            </p>
            <ul className="mt-4 space-y-2">
              {serviceLinks.map((service) => (
                <li key={service.href + service.label}>
                  <Link
                    href={service.href}
                    className="group flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-kay-border-light hover:bg-kay-surface"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kay-surface text-kay-gold">
                      <service.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[14px] font-medium text-kay-fg">
                          {service.label}
                        </span>
                        <IconArrowRight className="h-3.5 w-3.5 shrink-0 text-kay-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-kay-gold" />
                      </span>
                      <span className="mt-0.5 block text-[12px] text-kay-muted">
                        {service.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#111111] p-5 text-white">
            <div className="flex items-center gap-2">
              <IconDiamond className="h-4 w-4 text-kay-gold" />
              <h3 className="font-serif text-[17px]">Kay Concierge</h3>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/70">
              Hard-to-find luxury, limited editions, and bespoke sourcing —
              handled by our team.
            </p>
            <Link
              href="/concierge"
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/20 text-[13px] font-medium transition-colors hover:border-kay-gold hover:bg-white/5"
            >
              Start a request
            </Link>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-sky-50/80 px-4 py-4">
            <div className="flex gap-3">
              <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
              <p className="text-[12px] leading-relaxed text-sky-900/85">
                Every Kay order is curated, verified, and delivered with
                white-glove care.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </AccountLayout>
  );
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="px-6 py-5 sm:px-5 sm:py-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-kay-subtle">
        {label}
      </p>
      <p
        className={`mt-2 font-serif text-[22px] tracking-tight sm:text-[24px] ${
          accent ? "text-kay-gold" : "text-kay-fg"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
