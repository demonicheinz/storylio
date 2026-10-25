# Prefetch and dashboard Home streaming fixes

Date: October 25, 2026

Follow-up: `task/global-prefetch/report.md` records the subsequent global
Partial Prefetching adoption and the expansion to all remaining async routes.
The configuration and navbar policy described below are the earlier fix stage.

## Navbar prefetch

The GooeyNav integration carried forward `prefetch={true}` from the old navbar.
With this project's `cacheComponents: true` and `partialPrefetching: false`,
that setting forces legacy full prefetches, including uncached runtime data.
Next.js 16.4.2 reports the supplied instant-link-prefetch-partial diagnostic.

The explicit `true` was removed. Links keep Next.js client navigation and
default automatic prefetching. Prefetching is not disabled. The global cache
configuration, route data functions, and instant-navigation validation remain
enabled and unchanged. DESIGN.md now documents the updated policy.

The persistent GooeyNav browser check now fails if it observes either the
dynamic-data-prefetch message or the instant-link-prefetch-partial diagnostic.

## Dashboard Home streaming

`HomeManagePage` previously awaited `connection()` and its database queries
before it could return any heading or route-local Suspense boundary. The shared
layout's existing boundary can support initial rendering but does not give the
destination its own immediate loading UI during later client navigation.

The page now renders its heading and description synchronously. The existing
request-bound data code is in `HomeManageContent`, directly beneath a page-local
Suspense boundary with a named loading skeleton. Database queries still run at
request time; profile/auth checks and data freshness are not replaced by shared
caching. No `instant = false` or other validation opt-out was introduced.

## Verification

- A new regression test failed on the original async page and passed after the
  split. With `connection()` deliberately left pending, the heading and loading
  skeleton render and neither database query executes. The test mocks all data
  access and uses no real database or email credentials.
- Full Vitest suite: 13 files, 83 tests passed.
- TypeScript, targeted Biome checks, and whitespace checks passed.
- The full GooeyNav CLI browser check passed on the local dev app: all five
  destinations, client navigation without document reloads, Back/Forward,
  detail-route refresh, responsive targets, keyboard focus, reduced motion,
  WebGL recovery, and the new prefetch-warning assertion.
- The passing browser run recorded no page exceptions or targeted prefetch
  warnings. The production-only cache-reuse suite was not run against this
  development server.

Authenticated dashboard browser verification could not be completed: the
connected Test profile exposed its existing dashboard tab in the inventory,
but attempts to attach timed out and then returned `Debugger unattached`.
No credentials were extracted and authentication was not bypassed. Dashboard
verification is therefore the server-rendering regression plus TypeScript,
not a claim of a completed logged-in browser navigation.

Source references consulted: the installed Next.js docs for Link, connection,
loading, and Partial Prefetching, plus official documentation for
instant-link-prefetch-partial and blocking-prerender-dynamic. This patch fixes
the two reported call sites, without adopting Partial Prefetching globally or
changing unrelated dashboard pages.

Changes are local and have not been committed or pushed.

## Self-review

| Axis | Score | Evidence / remaining limit |
| --- | --- | --- |
| Accuracy | 4/5 | Source-backed fixes and passing regressions; logged-in dashboard navigation was unavailable. |
| Completeness | 4/5 | Both reported sites fixed; live authenticated and production cache checks remain separate. |
| Clarity | 5/5 | The Link policy and route-local data boundary each have one explicit responsibility. |
| Actionability | 5/5 | Applied code and repeatable warning regression are present. |
| Conciseness | 5/5 | One Link prop removed; Home data mappings and queries preserved. |

Overall: 4.6/5. The remaining verification is a logged-in Home navigation when
the browser debugger connection is available.
