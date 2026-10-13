import "server-only";
import { PostHog } from "posthog-node";
import type { AnalyticsEventName, AnalyticsEvents } from "./events";

let client: PostHog | null | undefined;

function getClient(): PostHog | null {
  if (client !== undefined) return client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    client = null;
    return client;
  }
  client = new PostHog(key, {
    host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
    // Serverless: send immediately, don't batch across invocations.
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

/** Typed server-side capture. Awaits the flush so serverless doesn't drop it. */
export async function captureServer<E extends AnalyticsEventName>(
  distinctId: string,
  event: E,
  properties: AnalyticsEvents[E],
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  try {
    ph.capture({ distinctId, event, properties });
    await ph.flush();
  } catch {
    // Analytics must never break a request.
  }
}

export async function captureServerException(
  error: unknown,
  distinctId?: string,
  context?: Record<string, unknown>,
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  try {
    ph.captureException(error, distinctId, context);
    await ph.flush();
  } catch {
    // ignore
  }
}
