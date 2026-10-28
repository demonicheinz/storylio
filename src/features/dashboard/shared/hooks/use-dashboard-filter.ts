"use client";

import { useSearchParams } from "next/navigation";

/** Native history keeps filters shareable without re-fetching the entire CMS list. */
export function useDashboardFilter<T extends string>(
  key: string,
  options: readonly T[],
  fallback: T,
): [T, (value: T) => void] {
  const search = useSearchParams();
  const raw = search.get(key);
  const value = options.includes(raw as T) ? (raw as T) : fallback;
  const change = (next: T) => {
    const url = new URL(window.location.href);
    if (next === fallback) url.searchParams.delete(key);
    else url.searchParams.set(key, next);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  };
  return [value, change];
}
