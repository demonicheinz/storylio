import type { Instrumentation } from "next";
import { getSentryDsn, isExpectedNavigationError } from "@/lib/monitoring";

function enabled() {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" &&
    Boolean(
      getSentryDsn(
        process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      ),
    )
  );
}

export async function register() {
  if (!enabled()) return;
  if (process.env.NEXT_RUNTIME === "nodejs")
    await import("../sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge")
    await import("../sentry.edge.config");
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (!enabled() || isExpectedNavigationError(error)) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.withScope((scope) => {
    scope.setTags({
      "next.route_type": context.routeType,
      "next.render_source": context.renderSource ?? "unknown",
      "next.revalidate_reason": context.revalidateReason ?? "none",
      "next.resume": request.headers["next-resume"] === "1" ? "true" : "false",
    });
    Sentry.captureRequestError(error, request, context);
  });
};
