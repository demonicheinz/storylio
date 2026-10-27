# Cache Components and Partial Prefetching

Storylio enables both `cacheComponents: true` and `partialPrefetching: true`
in `next.config.ts`. A default Next.js Link prepares the shared route shell.
Public navbar links use `prefetch={true}` to also resolve the known destination's
URL-dependent cached content. With Partial Prefetching, this does not restore the
legacy full prefetch of uncached request-time work.

## Route ownership

- Public lists, About, Gallery, and detail pages return a synchronous
  `PublicRouteBoundary`. Its async child reads `searchParams`/`params` and calls
  cached public data functions. Existing page content and metadata are retained.
- Public Home already reads cached data and does not depend on URL values.
- Dashboard pages place request-time queries inside a page-local boundary.
  Home, Overview, Media, and Analytics retain their tailored fallbacks; the
  remaining async pages use `DashboardRouteBoundary`.
- New post/project editors have no server data to await and remain synchronous.
- Preview routes stream their authorization and draft reads behind a boundary.
  Draft data and preview MDX are not placed in public shared caches.
- Auth, upload/download, tracking, and other API handlers retain their existing
  behavior. Global Partial Prefetching is not a global HTTP-response cache.

Keep URL reads below a route-local Suspense boundary. A boundary in a shared
layout alone may not provide the destination UI needed during client navigation.
Do not disable instant-navigation validation to avoid handling a blocking read.

## Detail HTTP status

Public article/project details also have a pre-render existence check in
`src/proxy.ts`. It reads only an ID by the unique slug and publication rules,
including the article publication date. Missing, draft, and future articles
rewrite to `/not-found` with HTTP 404 and `noindex`; the original URL is kept.
These responses use `private, no-store` so publishing a previously missing slug
does not leave a cached 404. Database errors propagate as errors rather than 404.

This adds one uncached existence query per server request to a public detail URL,
including prefetch requests. Collection routes do not perform this lookup.
It is deliberate: a page or parent layout can already stream before its cached
detail lookup calls `notFound()`, at which point the HTTP status is fixed at 200.
The page-level check remains for changes occurring between the two reads.
Dashboard authentication applies only to dashboard paths, independently of the
public checks. Do not move this lookup inside Suspense or cache publication
decisions without a corresponding freshness policy.

After a production build, run the following in an isolated browser session:

```powershell
bunx --no-install playwright-cli -s=storylio-gooey run-code --filename=tests/browser/public-detail-status.js
```

This checks HTML, RSC prefetch, HEAD, branded 404 rendering, client navigation,
and published detail responses. Draft and scheduled-content fixtures live only
in the PGlite proxy integration tests, not in the external database.

## Public cache dependencies

The tag names are defined in `src/lib/public-cache-tags.ts`.

| Tag | Cached content | Invalidated after successful CMS writes |
| --- | --- | --- |
| public-home | Home sections and testimonials | Home actions |
| public-projects | Project lists, detail, neighbors, public project MDX | Project actions |
| public-posts | Blog lists, articles, companions, public article MDX | Post actions |
| public-gallery | Visible gallery images and categories | Gallery actions |
| public-about | About text, structured sections, About MDX | About and structured About actions |
| public-profile | Public profile fields and footer social links | Profile settings actions |

Home's aggregate data additionally depends on the project, post, and profile
tags. The existing public cache lifetimes (`minutes`/`hours`) remain in place.
`renderPublicMDX` caches only published post/project rendering. A changed content
string has its own cache key, and the resource tag also expires old renders.

CMS Server Actions call `updateTag` after successful writes for read-your-writes
behavior, while retaining `revalidatePath` for affected route URLs. Failed or
unauthorized mutations must not invalidate the cache. Keep invalidation after
the transaction commits. `updateTag` is a Server Action API; other callers need
an appropriate invalidation strategy rather than copying it into Route Handlers.

Dashboard queries remain uncached. The About dashboard explicitly calls
`getAboutContentUncached`; public rendering uses the cached `getAboutContent`.
Never move session or draft data into the public tag groups.

## Intent-driven links

Writing format links opt into URL prefetch on hover/focus. Its single-topic
searchable popover navigates on selection, clears the page and open-note state, and preserves
unrelated query values and scroll. Published article/Notes facets are cached
without user arguments; unknown topics short-circuit before row caching. Filtered
counts derive from those facets, and page rows use SQL limit/offset only after
the requested page is clamped. Notes retain the existing `?tag=notes` archive.
Projects uses a searchable multi-select: the highlighted option
requests a router prefetch for its next selection only while the panel is open.
Next.js may reuse the existing partial shell without another request; selected
result data can still load on navigation. Both preserve unrelated query parameters
and scroll position. Projects stores AND combinations as repeated `tech` params,
trimmed, deduplicated, and sorted before they reach the public query/cache key.
Reset clears the stack without dropping unrelated parameters; Back/Forward
restores the URL-derived selection.
Changing or resetting the stack also removes `page`, returning to the first
result page. `getPublicProjects` validates canonical selections against shared,
argument-free cached facets. Unknown technologies return zero results without
creating count or row cache entries. Counts are cached by the validated stack;
pages are clamped against that count before entering the row cache, so arbitrary
out-of-range page numbers share the last valid page entry. All three caches use
the projects tag and a minutes lifetime. Rows use SQL limit/offset for six
cards. Ordering is featured first, CMS order, newest creation date, then unique
id to keep page boundaries stable. Page links preserve every `tech` and unrelated
parameter. Explicit page clicks focus/scroll to Project results with the navbar
offset; Back/Forward leaves restoration to the browser.
About language links prefetch their URL-specific cached variants. Ordinary
links can keep the default when only the shared shell is needed.

## Verification

Run `bun run test` and `bun typecheck`. The route-shell tests hold URL/request
promises unresolved and verify that route entry points return boundaries first.
PGlite action tests verify resource-tag invalidation and rollback behavior.

Automatic production prefetching must be tested on a production build. Run
`bun run build`, then `bun run start --port 3002` and the existing browser
navigation, About-language, filter, and security smoke checks in an isolated CLI
session. Development tests capture runtime/URL/prefetch diagnostics separately.

Partial-prefetch requests use more than one nonempty `next-router-prefetch`
header value. Browser tests distinguish any such prefetch from a navigation.
The language timing test allows the delayed payload to reach the router cache
before measuring clicks; it does not promise an instant cold first visit.

Consult the installed Next.js docs for `adopting-partial-prefetching`,
`optimizing-prefetching`, `cacheLife`, `cacheTag`, and `updateTag` before changing
this policy. Database index decisions are separate; see
`docs/DRIZZLE_MIGRATION.md` and the source-based review in
`task/global-prefetch/index-review.md`.
