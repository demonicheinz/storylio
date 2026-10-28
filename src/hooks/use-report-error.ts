"use client";

import { useEffect } from "react";
import { isExpectedNavigationError } from "@/lib/monitoring";

const reported = new WeakSet<object>();

export function useReportError(
  error: unknown,
  boundary: "root" | "global" | "public" | "dashboard",
) {
  useEffect(() => {
    if (isExpectedNavigationError(error)) return;
    if (
      error !== null &&
      (typeof error === "object" || typeof error === "function")
    ) {
      if (reported.has(error)) return;
      reported.add(error);
    }
    if (process.env.NODE_ENV !== "production") {
      console.error(`Storylio ${boundary} boundary:`, error);
      return;
    }
    if (
      process.env.NEXT_PUBLIC_SENTRY_ENABLED !== "true" ||
      !process.env.NEXT_PUBLIC_SENTRY_DSN
    )
      return;
    // Monitoring failure must never replace the recovery UI with another error.
    void import("@sentry/nextjs")
      .then((Sentry) => {
        Sentry.captureException(error, { tags: { boundary } });
      })
      .catch(() => {});
  }, [error, boundary]);
}
