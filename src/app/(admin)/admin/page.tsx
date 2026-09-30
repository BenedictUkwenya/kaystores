import Link from "next/link";
import { fetchAdminOverview } from "@/lib/admin/repository";
import { requireAdmin } from "@/lib/auth/roles";
import { countSupportThreadsNeedingAttention } from "@/lib/support/repository";
import { countAdminTodo, isActiveJob, loadAdminJobs } from "@/lib/jobs";
import { JOB_KIND_LABELS, isJobKind } from "@/lib/jobs/labels";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { JobInboxLanes } from "@/components/jobs/JobInboxLanes";
import { HowKayWorks } from "@/components/jobs/HowKayWorks";

type Props = { searchParams: Promise<{ kind?: string }> };

export default async function AdminTodayPage({ searchParams }: Props) {
  await requireAdmin();
  const { kind: kindParam } = await searchParams;
  const kind = kindParam && isJobKind(kindParam) ? kindParam : null;

  const [allJobs, stats, support] = await Promise.all([
    loadAdminJobs(),
    fetchAdminOverview(),
    countSupportThreadsNeedingAttention().catch(() => 0),
  ]);
  const active = allJobs.filter(isActiveJob);
  const jobs = kind ? active.filter((job) => job.kind === kind) : active;
  const todo = countAdminTodo(active);

  const alsoWaiting = [
    { href: "/admin/support", label: "support messages to answer", count: support },
    { href: "/admin/payouts", label: "vendor payouts to review", count: stats.pendingWithdrawals },
    {
      href: "/admin/vendors/applications",
      label: "vendor applications",
      count: stats.pendingVendorApplications,
    },
  ].filter((item) => item.count > 0);

  const filters = [
    { href: "/admin", label: "Everything", count: todo.total, active: !kind },
    ...(["gift", "kitchen", "concierge"] as const).map((k) => ({
      href: `/admin?kind=${k}`,
      label: JOB_KIND_LABELS[k],
      count: todo[k],
      active: kind === k,
    })),
  ];

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Today"
      title={
        todo.total === 0
          ? "You're all caught up"
          : `${todo.total} ${todo.total === 1 ? "thing needs" : "things need"} you`
      }
      description="Every gift order, cake request and concierge request in one place, sorted by whose turn it is. Start at the top of “Your turn”."
      badge="Admin"
    >
      <div className="space-y-6">
        <HowKayWorks defaultOpen={todo.total === 0 && active.length === 0} />

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-medium ${
                f.active
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-kay-border bg-kay-surface-elevated text-kay-muted hover:text-kay-fg"
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-semibold ${
                    f.active ? "bg-kay-gold text-[#111111]" : "bg-kay-gold-light text-kay-fg"
                  }`}
                >
                  {f.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {alsoWaiting.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[12px]">
            <span className="text-kay-subtle">Also waiting:</span>
            {alsoWaiting.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-kay-border-light bg-kay-surface-elevated px-3 py-1 text-kay-fg hover:border-kay-gold"
              >
                <strong>{item.count}</strong> {item.label}
              </Link>
            ))}
          </div>
        )}

        <JobInboxLanes jobs={jobs} />
      </div>
    </DashboardLayout>
  );
}
