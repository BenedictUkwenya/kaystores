import Link from "next/link";
import { requireVendor } from "@/lib/auth/roles";
import { formatNaira } from "@/lib/data/home";
import { getVendorWalletSummary } from "@/lib/vendors/repository";
import { loadVendorJobs } from "@/lib/jobs";
import type { VendorJobTab } from "@/lib/jobs/types";
import { VENDOR_TAB_LABELS } from "@/lib/jobs/labels";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { VendorJobCard } from "@/components/jobs/JobCard";
import { IconPlus } from "@/components/ui/Icons";

const TABS: VendorJobTab[] = ["todo", "in_progress", "done"];

const EMPTY: Record<VendorJobTab, string> = {
  todo: "Nothing for you to do right now. Kay will email you when a new job comes in.",
  in_progress: "Nothing in progress.",
  done: "No finished jobs yet.",
};

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function VendorJobsPage({ searchParams }: Props) {
  const { vendor } = await requireVendor();
  const { tab: tabParam } = await searchParams;
  const tab: VendorJobTab = TABS.includes(tabParam as VendorJobTab)
    ? (tabParam as VendorJobTab)
    : "todo";

  const [jobs, wallet] = await Promise.all([
    loadVendorJobs(vendor.id),
    getVendorWalletSummary(vendor.id),
  ]);
  const counts = Object.fromEntries(
    TABS.map((t) => [t, jobs.filter((job) => job.tab === t).length]),
  ) as Record<VendorJobTab, number>;
  const visible = jobs.filter((job) => job.tab === tab);
  const shown =
    tab === "done"
      ? [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30)
      : visible;

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow={vendor.businessName}
      title={
        counts.todo === 0
          ? "You're all caught up"
          : `${counts.todo} ${counts.todo === 1 ? "job needs" : "jobs need"} you`
      }
      description="Everything Kay has sent you: gift orders to send to a Kay hub, cake briefs to price and make, and client requests to check stock for."
      actions={
        <Link
          href="/vendor/products/new"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-kay-accent px-5 text-[12px] font-medium text-kay-accent-fg"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Add product
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/vendor/wallet"
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-4 hover:border-kay-gold"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-kay-subtle">Ready to withdraw</p>
            <p className="mt-1 font-serif text-[24px] text-kay-fg">{formatNaira(wallet.available)}</p>
          </Link>
          <Link
            href="/vendor/wallet"
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-4 hover:border-kay-gold"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-kay-subtle">Paid after delivery</p>
            <p className="mt-1 font-serif text-[24px] text-kay-fg">{formatNaira(wallet.pending)}</p>
          </Link>
        </div>

        <div className="rounded-2xl border border-kay-border-light bg-kay-surface/60 px-4 py-3 text-[12px] leading-relaxed text-kay-muted">
          <strong className="text-kay-fg">How it works:</strong> you only ever deal with Kay. Send your
          price or item to Kay, never to the client. Once the client pays, bring it to the Kay hub shown
          on the job and tap &quot;I&apos;ve sent it&quot;. You&apos;re paid after delivery.
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t}
              href={t === "todo" ? "/vendor" : `/vendor?tab=${t}`}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium ${
                t === tab
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-kay-border bg-kay-surface-elevated text-kay-muted hover:text-kay-fg"
              }`}
            >
              {VENDOR_TAB_LABELS[t]}
              <span
                className={`rounded-full px-1.5 text-[11px] font-semibold ${
                  t === tab
                    ? "bg-kay-gold text-[#111111]"
                    : t === "todo" && counts.todo > 0
                      ? "bg-kay-gold-light text-kay-fg"
                      : "text-kay-subtle"
                }`}
              >
                {counts[t]}
              </span>
            </Link>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-kay-border-light px-6 py-12 text-center text-[13px] text-kay-muted">
            {EMPTY[tab]}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {shown.map((job) => (
              <VendorJobCard key={job.key} job={job} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
