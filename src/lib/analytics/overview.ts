import "server-only";

/**
 * Reads headline numbers from PostHog's Query API (HogQL) for the admin
 * Analytics page. Server-only: the personal API key must never reach the browser.
 */

export type AnalyticsRange = 7 | 30;

export type AnalyticsOverview = {
  days: AnalyticsRange;
  visitors: number;
  pageviews: number;
  sessions: number;
  daily: { day: string; views: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  referrers: { source: string; visitors: number }[];
  funnel: { label: string; count: number }[];
  paidOrders: number;
  revenue: number;
  errors: number;
  topErrors: { message: string; count: number }[];
};

type Config = { host: string; projectId: string; apiKey: string };

export function getPostHogQueryConfig(): Config | null {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId) return null;
  return {
    apiKey,
    projectId,
    host: (process.env.POSTHOG_API_HOST || "https://us.posthog.com").replace(/\/$/, ""),
  };
}

async function hogql(config: Config, query: string): Promise<unknown[][]> {
  const res = await fetch(
    `${config.host}/api/projects/${encodeURIComponent(config.projectId)}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      // Keep the admin page quick and PostHog quota-friendly.
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) {
    throw new Error(`PostHog query failed (${res.status})`);
  }
  const data = (await res.json()) as { results?: unknown[][] };
  return data.results ?? [];
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const FUNNEL_STEPS: { event: string; label: string }[] = [
  { event: "product_viewed", label: "Viewed a product" },
  { event: "product_added_to_cart", label: "Added to bag" },
  { event: "checkout_started", label: "Started checkout" },
  { event: "order_created", label: "Placed an order" },
];

export async function fetchAnalyticsOverview(
  config: Config,
  days: AnalyticsRange,
): Promise<AnalyticsOverview> {
  const since = `timestamp >= now() - INTERVAL ${days} DAY`;
  const pv = `event = '$pageview' AND ${since}`;
  const stepList = FUNNEL_STEPS.map((s) => `'${s.event}'`).join(", ");

  const [totals, daily, pages, refs, funnel, paid, errs, errTop] = await Promise.all([
    hogql(
      config,
      `SELECT count(), uniq(distinct_id), uniq(properties.$session_id) FROM events WHERE ${pv}`,
    ),
    hogql(
      config,
      `SELECT toString(toDate(timestamp)) AS d, count(), uniq(distinct_id) FROM events WHERE ${pv} GROUP BY d ORDER BY d`,
    ),
    hogql(
      config,
      `SELECT properties.$pathname AS p, count() AS c FROM events WHERE ${pv} AND p IS NOT NULL GROUP BY p ORDER BY c DESC LIMIT 8`,
    ),
    hogql(
      config,
      `SELECT properties.$referring_domain AS r, uniq(distinct_id) AS c FROM events WHERE ${pv} AND r IS NOT NULL AND r != '' AND r != '$direct' GROUP BY r ORDER BY c DESC LIMIT 6`,
    ),
    hogql(
      config,
      `SELECT event, uniq(distinct_id) FROM events WHERE event IN (${stepList}) AND ${since} GROUP BY event`,
    ),
    hogql(
      config,
      `SELECT count(), sum(toFloat(properties.amount)) FROM events WHERE event = 'payment_confirmed' AND ${since}`,
    ),
    hogql(
      config,
      `SELECT count() FROM events WHERE event = '$exception' AND ${since}`,
    ),
    hogql(
      config,
      `SELECT toString(properties.$exception_values[1]) AS m, count() AS c FROM events WHERE event = '$exception' AND ${since} GROUP BY m ORDER BY c DESC LIMIT 5`,
    ),
  ]);

  const funnelCounts = new Map(funnel.map((r) => [String(r[0]), num(r[1])]));

  return {
    days,
    pageviews: num(totals[0]?.[0]),
    visitors: num(totals[0]?.[1]),
    sessions: num(totals[0]?.[2]),
    daily: daily.map((r) => ({
      day: String(r[0]),
      views: num(r[1]),
      visitors: num(r[2]),
    })),
    topPages: pages.map((r) => ({ path: String(r[0]), views: num(r[1]) })),
    referrers: refs.map((r) => ({ source: String(r[0]), visitors: num(r[1]) })),
    funnel: FUNNEL_STEPS.map((s) => ({
      label: s.label,
      count: funnelCounts.get(s.event) ?? 0,
    })),
    paidOrders: num(paid[0]?.[0]),
    revenue: num(paid[0]?.[1]),
    errors: num(errs[0]?.[0]),
    topErrors: errTop
      .filter((r) => r[0])
      .map((r) => ({ message: String(r[0]).slice(0, 140), count: num(r[1]) })),
  };
}
