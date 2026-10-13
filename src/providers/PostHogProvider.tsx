"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/** Areas where nothing is recorded at all. */
function isIgnoredPath(path: string) {
  return path.startsWith("/admin");
}

function initPostHog() {
  if (!KEY || typeof window === "undefined" || posthog.__loaded) return;

  posthog.init(KEY, {
    // First-party proxy (see next.config.ts rewrites) so ad blockers don't drop events.
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2025-05-24",
    // App Router navigations are tracked manually below.
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    capture_exceptions: true,
    person_profiles: "identified_only",
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
    },
    before_send: (event) => {
      if (!event) return null;
      const path = window.location.pathname;
      if (isIgnoredPath(path)) return null;
      // Never record screens from the age-gated adult area.
      if (event.event === "$snapshot" && path.startsWith("/after-dark")) {
        return null;
      }
      return event;
    },
  });
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!KEY || !pathname || isIgnoredPath(pathname)) return;
    const qs = searchParams?.toString();
    posthog.capture("$pageview", {
      $current_url: window.location.origin + pathname + (qs ? `?${qs}` : ""),
    });
  }, [pathname, searchParams]);

  return null;
}

function IdentityTracker() {
  useEffect(() => {
    if (!KEY) return;
    const sb = createBrowserSupabase();
    if (!sb) return;

    let current: string | null = null;
    const apply = (user: { id: string } | null | undefined) => {
      if (user?.id) {
        if (current !== user.id) {
          // Opaque Supabase user id only — no email or name.
          posthog.identify(user.id);
          current = user.id;
        }
      } else if (current) {
        posthog.reset();
        current = null;
      }
    };

    sb.auth.getUser().then(({ data }) => apply(data.user));
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => apply(session?.user));
    return () => subscription.unsubscribe();
  }, []);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      <IdentityTracker />
      {children}
    </>
  );
}
