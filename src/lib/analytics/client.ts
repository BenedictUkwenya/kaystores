"use client";

import posthog from "posthog-js";
import type { AnalyticsEventName, AnalyticsEvents } from "./events";

/** Typed client-side capture. Safe to call before PostHog loads or when unconfigured. */
export function track<E extends AnalyticsEventName>(
  event: E,
  properties: AnalyticsEvents[E],
): void {
  try {
    if (typeof window === "undefined" || !posthog.__loaded) return;
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the shop.
  }
}

/** Report a handled error to PostHog error tracking. */
export function captureClientException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  try {
    if (typeof window === "undefined" || !posthog.__loaded) return;
    posthog.captureException(error, context);
  } catch {
    // ignore
  }
}
