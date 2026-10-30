# Boundary artwork and Sentry integration

Owner request: adapt the supplied reference using Earth and transparent astronaut
assets, and implement Sentry error monitoring. No commit, push, Sentry project
creation, credential changes, email, external migration or event upload performed.

## Final implementation

- SpaceState is the shared public 404 composition: Clash Display outline 404,
  cropped transparent astronaut canvas, slow 9-second drift, sparse stars,
  Earth horizon, one primary Home link and optional context archive link.
  Keyboard targets are 48px. Reduced motion stops spatial animation. The original
  2728x1536 AVIF assets remain intact; CSS crops the astronaut's transparent area.
- Root and public/project/article not-found boundaries share that composition.
  Dashboard missing-item recovery stays compact. Unexpected errors use a quiet
  shared retry/navigation view, without internal exception messages or 404 art.
- All error entrypoints use Next 16.4's stable retry prop. The minimal global
  fallback keeps its own document and inline navy/blue styles for layout failure.
- Removed the explicit (public)/not-found/page.tsx. The existing proxy rewrite
  URL /not-found is now deliberately unmatched, allowing Next to serve its static
  root 404 rather than streaming an error through async public chrome. Proxy
  publication and owner checks are unchanged; database failures stay exceptions.
- Added official @sentry/nextjs 11.9.0: browser, Node, edge and onRequestError
  instrumentation, shared boundary reporting, strict DSN/CSP validation and
  opt-in source-map build integration through @sentry/nextjs/config.
- Reporting requires production, NEXT_PUBLIC_SENTRY_ENABLED=true and valid DSN.
  Source-map upload separately requires its explicit upload flag and credentials.
  SDK build telemetry, traces, Replay, Sentry Logs, breadcrumbs, client reports,
  console capture and browser/process session telemetry are disabled.
- beforeSend removes user identity, request bodies, headers, cookies, contexts,
  extra dumps and breadcrumbs; strips queries/fragments; redacts recognizable
  credentials/email patterns; removes frame variables while preserving source-map
  identifiers and line numbers. Generic scrubbing cannot identify every possible
  secret embedded in arbitrary prose; errors must never contain raw form content.
- Expected Next 404/redirect control flow is dropped. WeakSet deduplication safely
  handles Error objects and primitive thrown values without breaking fallback UI.
- A pre-existing fixture defect was corrected: authRateLimits now actually gates
  the additive test table, preserving the legacy baseline test's schema. No SQL
  migration or application database was changed by that correction.

## Evidence

- Final full suite: 48 files / 281 tests passed. After final routing cleanup,
  targeted proxy/component/privacy tests also passed. TypeScript and lint passed
  (466 files in the final tree). Whitespace checks passed.
- SDK local transport produced a scrubbed exception envelope; 404 was discarded.
  Mocked instrumentation tested enablement, Node registration, expected-control-
  flow filtering, and request-error forwarding. Config tests preserved Cache
  Components/Partial Prefetching and allowed only the exact DSN ingest origin.
- Production build passed with the Sentry build wrapper enabled, empty DSNs and
  uploads disabled. Final production build with reporting off passed: 35 routes.
  Temporary fixture routes were removed before build. No public .map files were
  found in .next/static during source-map verification.
- Production browser regression passed at 1440x1000, 1024x900, 768x1024,
  390x844, 320x740 and 844x390: real HTTP 404, one main landmark, no overflow,
  keyboard access, reduced motion and astronaut drift. Cold project/article and
  /not-found requests remained 404. RSC prefetch requests also returned 404.
- With JavaScript disabled, a missing-project rewrite displayed its Home link
  and artwork with HTTP 404. Zero unexpected page errors and zero Sentry requests
  were recorded in the production regression.
- Real public error boundary tested using a disposable client fixture: trigger
  error -> safe recovery UI -> Try again -> fixture recovered. It verified stable
  retry rather than only a mocked click handler. Fixture source is archived under
  tests/fixtures/recovery and documented for repeat runs, not served in production.
- Desktop/mobile 404 screenshots and a mobile retry screenshot were visually
  inspected. Local design detector reported zero findings for SpaceState.
- Dependency audit still fails on the same two existing high advisories:
  body-parser 2.3.0 through shadcn tooling and Zod 4.4.3. No Sentry advisory was
  added by the install. No unrelated dependency upgrades were performed.

## Verification lessons and limits

Dev initially accepted a static 404 renderer with a forced rewrite status, but
production served 200. A page-level notFound handoff fixed status but still hid
the streamed fallback without JavaScript. Removing the intermediary route and
using the pre-rendered root 404 resolved both; final production checks above
verify that result. Stale generated dev route types from removed fixtures were
archived reversibly inside ignored .tmp before rebuilding.

SDK 11 moved withSentryConfig to a config subpath and narrowed exported types;
the integration follows installed public exports. Automatic session integrations
were explicitly excluded so non-error session envelopes are not collected.

Physical devices, Safari/Firefox and a real hosted Sentry project were not tested.
No authenticated dashboard session was opened. Session Replay and performance
monitoring are deliberately out of scope. Activation instructions and secret
handling are in docs/MONITORING.md.

Self-review: accuracy 4/5 (production HTTP/browser and local envelope evidence;
no hosted Sentry test), completeness 4/5 (code ready, external activation requires
user configuration), clarity 4/5 (shared boundaries and one privacy policy),
actionability 5/5 (working local UI, docs, fixtures and repeatable checks),
conciseness 3/5 (production-only status behavior required several investigations).
Next: owner's visual approval and a dedicated Sentry test environment after DSN
and upload authorization. Temporary servers/browser sessions are closed after use.
