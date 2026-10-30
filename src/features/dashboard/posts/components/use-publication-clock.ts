"use client";

import { useEffect, useState } from "react";

/** Refresh at the nearest due date, and reconcile after returning to the tab. */
export function usePublicationClock(
  dates: readonly (string | null | undefined)[],
) {
  const [now, setNow] = useState(() => Date.now());
  const key = dates.filter(Boolean).join("|");
  useEffect(() => setNow(Date.now()), [key]);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const next = key
      .split("|")
      .map((value) => new Date(value).getTime())
      .filter((value) => value > Date.now())
      .sort((a, b) => a - b)[0];
    const timer = window.setTimeout(
      refresh,
      Math.min(next ? Math.max(1, next - Date.now() + 25) : 60_000, 60_000),
    );
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [key, now]);
  return now;
}
