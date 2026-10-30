# Global Partial Prefetching, public caching, and route streaming

Date: October 25, 2026

## Implemented

- Enabled `partialPrefetching: true` alongside the existing Cache Components.
- Public Projects, Blog, Gallery, About, and both detail pages now return a
  synchronous route-local boundary. URL values are resolved in the async child,
  fixing the Projects `await searchParams` navigation diagnostic and its peers.
- Both preview routes use a boundary without caching protected draft reads.
- Added local streaming boundaries to dashboard Projects, Posts, Gallery, About,
  Settings, Analytics, and the two edit routes. Home, Overview, and Media retain
  their existing tailored boundaries. New editors remain synchronous.
- Kept dashboard queries uncached. About management now uses the raw getter,
  separately from the public cached About-content getter.
- Kept existing public `minutes`/`hours` query lifetimes and added public
  resource tags. Home's aggregate data depends on Home, project, post, and
  profile tags; profile invalidation also covers About and the existing footer.
- Cached published article/project MDX rendering separately from draft previews.
- Successful CMS writes now expire matching resource tags with `updateTag`,
  retaining existing path revalidation. Rollbacks/unauthorized writes do not
  invalidate those caches.
- Public navbar links opt into URL-content prefetching under the new global
  policy. Filter variants still prefetch on intent; language variants retain
  their prefetch behavior.
- Removed obsolete `unstable_instant` sample exports. No validation opt-outs,
  authentication bypasses, dependency updates, or database DDL were introduced.

See `docs/CACHE_AND_PREFETCH.md` for the maintained operating rules and
`evidence.json` for machine-readable verification results.

## Verification

- 14 Vitest files / 102 tests passed. New route-shell tests cover the global flag
  and 16 URL/request-dependent route entry points. PGlite tests cover successful
  invalidation and failure/rollback behavior without real credentials.
- TypeScript, targeted Biome checks across 51 files, and whitespace checks passed.
- `bun run build` succeeded on Next.js 16.4.2 with both features enabled. It
  generated all 35 route entries. Protected dynamic pages and public URL pages
  appear as partial prerenders; static new-editor pages remain static.
- A separate local production server on port 3002 was used for the existing
  navigation, About-language, filter, and security smoke suites.
- All five public destinations reused cached UI on round two without skeletons
  or additional navigation requests. A cold first visit can still show fallback.
- With an injected 800ms RSC delay, the final warmed-language clicks took
  55ms, 42ms, and 40ms, with zero navigation requests and preserved scroll.
- Filters kept hover/focus-only warming, cache reuse, unrelated query parameters,
  and scroll position. Anonymous dashboard access still redirects to sign-in;
  session and OG-response smoke checks passed.
- Development navigation across the five pages and project detail passed with
  no captured runtime/uncached/URL/prefetch diagnostics or page exceptions.
  GooeyNav responsiveness, keyboard focus, reduced motion, and WebGL fallback
  checks also passed.

## Test-harness corrections

The older public-navigation and language suites removed interceptors without
waiting for delayed handlers. They now drain them with `unrouteAll` using
`behavior: "wait"`, matching the existing filter suite and avoiding cross-run
`Route is already handled` errors.

Partial Prefetching uses multiple prefetch-header values. Tests now distinguish
any nonempty prefetch marker from a real navigation. The language suite allows
one second after response headers for the artificially delayed payload to enter
the router cache, then measures the interaction. Header arrival alone was an
intermittently premature readiness signal; cold-click latency is not hidden or
claimed instant. The timed interaction must finish faster than the injected
800ms server delay and issue no navigation request.

## Database indexing

Indexing is already declared in the Drizzle schema and baseline SQL: primary
and unique indexes, relation indexes, and the ViewEvent composite index.
`index-review.md` lists those and possible public-listing candidates. This is
source evidence, not a fresh inspection of live catalogs. No schema file,
migration, or database index was changed. Production EXPLAIN/index rollout is
outside this task.

## Limits and local state

The connected authenticated Test browser could not be attached during the prior
verification (`Debugger unattached`). This run verifies protected route shells
through tests/build and anonymous protection through a real production browser;
it does not claim logged-in browser timings for every admin screen.

The production build used the existing Infisical dev environment without
printing secret values. No migrations, credential changes, remote Git writes,
or deployments were performed. Framework-generated AGENTS.md header changes
were restored so custom repository guidance is not part of this patch.

The temporary production server and isolated test browsers are closed after
verification. The development server started when port 3000 was unavailable is
left available for review. Source changes remain uncommitted.

## Self-review

| Axis | Score | Evidence / remaining limit |
| --- | --- | --- |
| Accuracy | 5/5 | Full build, 102 tests, dev diagnostics, and production browser evidence. |
| Completeness | 4/5 | Public and all async admin/preview routes covered; logged-in admin timings remain unmeasured. |
| Clarity | 5/5 | Public tags, uncached admin data, and route boundaries have explicit owners. |
| Actionability | 5/5 | Applied code, maintained guide, and repeatable checks are present. |
| Conciseness | 4/5 | Existing page bodies and queries preserved; two shared boundaries avoid repeated skeletons. |

Overall: 4.6/5. Remaining performance work, if needed, is authenticated admin
measurement and an EXPLAIN-backed index review on representative data.
