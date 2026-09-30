import Link from "next/link";
import { countAdminTodo, isActiveJob, loadAdminJobs } from "@/lib/jobs";
import type { JobKind } from "@/lib/jobs/types";
import { JOB_KIND_BOARD_HREF } from "@/lib/jobs/labels";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { JobBoard } from "@/components/jobs/JobBoard";
import { JobInboxLanes } from "@/components/jobs/JobInboxLanes";

const COPY: Record<JobKind, { title: string; description: string }> = {
  gift: {
    title: "Gift orders",
    description:
      "Shop orders. The client pays first, each vendor sends their item to a Kay hub, you check it and deliver.",
  },
  kitchen: {
    title: "Kay Kitchen",
    description:
      "Custom cakes and treats. You pick a baker, they send their price, you add Kay's margin and quote the client.",
  },
  concierge: {
    title: "Concierge",
    description:
      "“Find me this” requests. Send to vendors, present the best offer, the client pays Kay, the vendor sends it to a hub.",
  },
};

export async function AdminBoardPage({ kind, view }: { kind: JobKind; view?: string }) {
  const jobs = (await loadAdminJobs()).filter((job) => job.kind === kind);
  const todo = countAdminTodo(jobs.filter(isActiveJob));
  const base = JOB_KIND_BOARD_HREF[kind];
  const asList = view === "list";

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow={todo.total > 0 ? `${todo.total} waiting on you` : "Nothing waiting on you"}
      title={COPY[kind].title}
      description={COPY[kind].description}
      badge="Admin"
      actions={
        <>
        {kind === "gift" && (
          <Link
            href="/api/admin/export/orders"
            className="inline-flex h-10 items-center rounded-full border border-kay-border px-4 text-[12px] font-medium text-kay-fg hover:border-kay-fg"
          >
            Export CSV
          </Link>
        )}
        <div className="inline-flex rounded-full border border-kay-border bg-kay-surface-elevated p-1 text-[12px] font-medium">
          <Link
            href={base}
            className={`rounded-full px-4 py-1.5 ${!asList ? "bg-[#111111] text-white" : "text-kay-muted"}`}
          >
            Board
          </Link>
          <Link
            href={`${base}?view=list`}
            className={`rounded-full px-4 py-1.5 ${asList ? "bg-[#111111] text-white" : "text-kay-muted"}`}
          >
            By whose turn
          </Link>
        </div>
        </>
      }
    >
      {asList ? <JobInboxLanes jobs={jobs.filter(isActiveJob)} /> : <JobBoard kind={kind} jobs={jobs} />}
    </DashboardLayout>
  );
}
