# CodeRabbit fixes — 2026-10-25

All three review findings are resolved. No commit, push, schema change, or
external database fixture was made for this task.

## Changes

- `src/proxy.ts` now checks public article/project detail existence before
  rendering, selecting only an ID with the same publication predicates as the
  pages. Blog checks include null or elapsed publication dates. Invalid encoded
  slugs are rejected; database errors propagate rather than becoming false 404s.
- Missing content rewrites to the explicit `/not-found` page, retaining the
  original requested URL. Status is 404, with `X-Robots-Tag: noindex, nofollow`
  and `Cache-Control: private, no-store`. The latter prevents a stale 404 after
  publishing a previously missing slug.
- Public checks do not call authentication. Dashboard authentication and owner
  checks remain restricted to dashboard paths. Collection/preview paths keep
  their existing behavior. Partial Prefetching and Cache Components stay enabled.
- Page-level `notFound()` remains as a safeguard if content changes after the
  initial check. The pre-render check adds one uncached ID lookup per detail
  server request, including prefetch requests. It does not claim transactional
  publication consistency across the separate existence and render reads.
- The no-WebGL init script runs only in a temporary page, closed in `finally`.
  Helpers accept a target page. The test still verifies navigation to Projects,
  the active link, static pill, and absence of a document reload. Both browser
  runtime errors and Next navigation diagnostics are collected on that page.
- The policy and reproducible HTTP/browser command are in
  `docs/CACHE_AND_PREFETCH.md`.

## Verification

The regression suite first failed against the old Proxy (13 failures, one
existing dashboard behavior passing), then passed after the implementation.
Tests use real PostgreSQL queries in PGlite with a mocked production connection
and authentication, never external database credentials.

| Check | Result |
| --- | --- |
| Complete Vitest suite, final run | 15 files, 116 tests passed |
| New proxy integration suite | 14 tests: missing, draft, future, published, undated, encoded slug, malformed slug, RSC/prefetch, unrelated paths, dashboard auth, database error |
| Targeted Biome lint | 5 changed code/test files passed |
| `bun typecheck` | Passed after correcting literal types in the new test fixture |
| Final `bun run build` | Passed, Next.js 16.4.2, 36 static pages generated, both cache features enabled |
| `git diff --check` | Passed |
| Gooey navigation CLI | Two complete consecutive passes in the same persistent `storylio-gooey` session |
| Anonymous dashboard/security smoke | Passed; no browser runtime errors |

Production verification used `bun run start --port 3002` with the dev Infisical
environment. Fresh UUID/unique missing paths in each public collection returned
404 before the fix's final validation. The original review had recorded 200.
The final browser HTTP test also verified `no-store` on HTML and RSC responses.

| Production scenario | Blog | Projects |
| --- | --- | --- |
| Missing slug, HTML | 404, branded UI, original URL retained | 404, branded UI, original URL retained |
| Missing slug, RSC prefetch | 404, text/x-component | 404, text/x-component |
| Missing slug, HEAD | 404 | 404 |
| Client router navigation to missing slug | Branded 404 | Branded 404 |
| Existing published detail | 200 | 200 |
| Back to home from 404 | Passed | Passed |

Published samples were `/blog/building-storylio-with-server-first-pages` and
`/projects/storylio`. Draft and future-post checks were performed in PGlite only.
The browser test exercises the installed Next router's exposed debugging
instance to trigger client navigation; it does not add application test routes.
The production test server and isolated Chromium session were closed afterward.

## Self-evaluation

Accuracy 4/5: concrete unit, HTTP, and browser evidence; concurrent publication
changes between the two reads remain an explicit limitation. Completeness 5/5:
all findings implemented, including repeat-session browser validation. Clarity
5/5: changes, cost, and test scope are separate. Actionability 5/5: code and
repeatable checks are in the workspace. Conciseness 4/5: this report contains
full evidence; the final response stays brief. Overall 4.6/5.

Improvement: any future stronger publication consistency policy should address
the existing page caches and the race between reads together. Self-check: the
result resolves the requested defects without claiming an external deployment.
