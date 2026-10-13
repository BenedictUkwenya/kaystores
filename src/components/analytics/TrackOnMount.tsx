"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/client";
import type { AnalyticsEventName, AnalyticsEvents } from "@/lib/analytics/events";

/** Fires one typed analytics event when a server-rendered page mounts. */
export function TrackOnMount<E extends AnalyticsEventName>({
  event,
  properties,
}: {
  event: E;
  properties: AnalyticsEvents[E];
}) {
  const key = JSON.stringify(properties);
  useEffect(() => {
    track(event, JSON.parse(key) as AnalyticsEvents[E]);
  }, [event, key]);
  return null;
}
