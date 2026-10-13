import type { Instrumentation } from "next";

/** Forwards every uncaught server-side request error to PostHog error tracking. */
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { captureServerException } = await import("@/lib/analytics/server");
  await captureServerException(err, undefined, {
    path: request.path,
    method: request.method,
    route_path: context.routePath,
    route_type: context.routeType,
    router_kind: context.routerKind,
  });
};
