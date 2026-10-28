import * as Sentry from "@sentry/nextjs";
import { errorMonitoringOptions, getSentryDsn } from "./src/lib/monitoring";

const dsn = getSentryDsn(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
);
if (process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" && dsn) {
  Sentry.init({
    ...errorMonitoringOptions(
      dsn,
      process.env.SENTRY_ENVIRONMENT ||
        process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
        process.env.VERCEL_ENV ||
        "production",
    ),
    enableOpenTelemetrySetup: false,
  });
}
