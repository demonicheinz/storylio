import * as Sentry from "@sentry/nextjs";
import { errorMonitoringOptions, getSentryDsn } from "@/lib/monitoring";

const dsn = getSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" &&
  dsn
) {
  Sentry.init({
    ...errorMonitoringOptions(
      dsn,
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "production",
    ),
  });
}

export function onRouterTransitionStart(
  ...args: Parameters<typeof Sentry.captureRouterTransitionStart>
) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" &&
    dsn
  ) {
    Sentry.captureRouterTransitionStart(...args);
  }
}
