import Link from "next/link";
import { requireAdmin } from "@/lib/auth/roles";
import { ADMIN_NAV, DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  fetchAnalyticsOverview,
  getPostHogQueryConfig,
  type AnalyticsOverview,
  type AnalyticsRange,
} from "@/lib/analytics/overview";
import { formatNaira } from "@/lib/data/home";

/** Optional override, e.g. https://us.posthog.com/project/663423 — pins links to one project. */
const POSTHOG_BASE = (
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_URL || "https://us.posthog.com"
).replace(/\/$/, "");

const DEEP_LINKS = [
  { path: "/replay/recent", label: "Session replays" },
  { path: "/insights", label: "Funnel builder" },
  { path: "/error_tracking", label: "All errors" },
  { path: "/activity/explore", label: "Live events" },
] as const;

type Props = { searchParams: Promise<{ days?: string }> };

const nf = new Intl.NumberFormat("en-NG");

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-kay-border bg-kay-surface-elevated p-4">
      <p className="text-[11px] uppercase tracking-wider text-kay-subtle">{label}</p>
      <p className="mt-1 font-serif text-[26px] leading-tight text-kay-fg">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-kay-muted">{hint}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-kay-border bg-kay-surface-elevated p-5">
      <h2 className="text-[13px] font-medium uppercase tracking-wider text-kay-muted">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-[13px] text-kay-muted">No data yet for this period.</p>;
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-[13px]">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-kay-fg">{r.label}</span>
            <span className="shrink-0 tabular-nums text-kay-muted">{nf.format(r.value)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-kay-surface">
            <div
              className="h-1.5 rounded-full bg-kay-gold"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DailyChart({ daily }: { daily: AnalyticsOverview["daily"] }) {
  if (!daily.length) return <Empty />;
  const max = Math.max(1, ...daily.map((d) => d.views));
  return (
    <div>
      <div className="flex h-36 items-end gap-1" role="img" aria-label="Page views per day">
        {daily.map((d) => (
          <div
            key={d.day}
            className="flex-1 rounded-t bg-kay-gold/80"
            style={{ height: `${Math.max(3, (d.views / max) * 100)}%` }}
            title={`${d.day}: ${d.views} views, ${d.visitors} visitors`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-kay-subtle">
        <span>{daily[0].day}</span>
        <span>{daily[daily.length - 1].day}</span>
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  await requireAdmin();
  const { days: daysParam } = await searchParams;
  const days: AnalyticsRange = daysParam === "30" ? 30 : 7;

  const config = getPostHogQueryConfig();
  let data: AnalyticsOverview | null = null;
  let failed = false;
  if (config) {
    try {
      data = await fetchAnalyticsOverview(config, days);
    } catch (err) {
      console.error("[admin/analytics]", err);
      failed = true;
    }
  }

  const funnelTop = data?.funnel[0]?.count ?? 0;

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Insights"
      title="Analytics"
      description="How shoppers are finding and using Kay Stores. Numbers refresh every few minutes."
      badge="Admin"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {([7, 30] as const).map((d) => (
            <Link
              key={d}
              href={`/admin/analytics?days=${d}`}
              className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium ${
                days === d
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-kay-border bg-kay-surface-elevated text-kay-muted hover:text-kay-fg"
              }`}
            >
              Last {d} days
            </Link>
          ))}
        </div>

        {!config && (
          <Panel title="Not connected yet">
            <p className="text-[13px] leading-relaxed text-kay-muted">
              Analytics numbers appear here once <code>POSTHOG_PERSONAL_API_KEY</code>{" "}
              and <code>POSTHOG_PROJECT_ID</code> are set on the server.
            </p>
          </Panel>
        )}

        {failed && (
          <Panel title="Couldn't load analytics">
            <p className="text-[13px] leading-relaxed text-kay-muted">
              PostHog didn&apos;t respond. Try again in a minute — if it keeps
              happening, check the API key and project id.
            </p>
          </Panel>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Visitors" value={nf.format(data.visitors)} hint="unique people" />
              <Stat label="Page views" value={nf.format(data.pageviews)} />
              <Stat label="Sessions" value={nf.format(data.sessions)} hint="visits" />
              <Stat
                label="Paid orders"
                value={nf.format(data.paidOrders)}
                hint={data.revenue > 0 ? formatNaira(Math.round(data.revenue)) : undefined}
              />
            </div>

            <Panel title="Page views per day">
              <DailyChart daily={data.daily} />
            </Panel>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Shopping funnel">
                {funnelTop === 0 ? (
                  <Empty />
                ) : (
                  <>
                    <Bars
                      rows={data.funnel.map((s) => ({
                        label: `${s.label} · ${Math.round((s.count / funnelTop) * 100)}%`,
                        value: s.count,
                      }))}
                    />
                    <p className="mt-4 text-[12px] text-kay-subtle">
                      Unique visitors who reached each step. Percentages are
                      relative to people who viewed a product.
                    </p>
                  </>
                )}
              </Panel>

              <Panel title="Where visitors come from">
                {data.referrers.length ? (
                  <Bars
                    rows={data.referrers.map((r) => ({ label: r.source, value: r.visitors }))}
                  />
                ) : (
                  <Empty />
                )}
              </Panel>

              <Panel title="Top pages">
                {data.topPages.length ? (
                  <Bars rows={data.topPages.map((p) => ({ label: p.path, value: p.views }))} />
                ) : (
                  <Empty />
                )}
              </Panel>

              <Panel title={`Errors · ${nf.format(data.errors)}`}>
                {data.topErrors.length ? (
                  <ul className="space-y-2 text-[13px]">
                    {data.topErrors.map((e) => (
                      <li key={e.message} className="flex justify-between gap-3">
                        <span className="min-w-0 break-words text-kay-fg">{e.message}</span>
                        <span className="shrink-0 tabular-nums text-kay-muted">
                          {nf.format(e.count)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-kay-muted">No errors recorded.</p>
                )}
              </Panel>
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-kay-border pt-4 text-[12px]">
          <span className="text-kay-subtle">Deeper dive in PostHog (needs a PostHog login):</span>
          {DEEP_LINKS.map((l) => (
            <a
              key={l.path}
              href={`${POSTHOG_BASE}${l.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-kay-border-light bg-kay-surface-elevated px-3 py-1 text-kay-fg hover:border-kay-gold"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
