# Error monitoring and recovery boundaries

Vercel runtime logs remain the server/deployment log source. Sentry adds error
monitoring for browser crashes, error boundaries and Next request errors. Umami
remains visitor analytics. Sentry Logs, Session Replay, performance tracing,
feedback widgets and automatic cron monitors are not enabled.

## Local implementation and activation

The SDK is installed and wired, but reporting is **off by default**. No Sentry
project or credentials were created and no events were sent to an external
Sentry endpoint during implementation. Tests use mocks or an in-process transport.

Configure these values in the matching Infisical environment and Vercel sync:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SENTRY_ENABLED` | Set to `true` to enable reporting in production builds. |
| `NEXT_PUBLIC_SENTRY_DSN` | Public project DSN from Sentry; HTTPS and project ID required. |
| `SENTRY_DSN` | Optional server DSN override; defaults to the public DSN. |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Browser environment label, such as `production` or `staging`. |
| `SENTRY_ENVIRONMENT` | Optional server environment label. |
| `SENTRY_ORG` | Organization slug, used for source map upload. |
| `SENTRY_PROJECT` | Project slug, used for source map upload. |
| `SENTRY_AUTH_TOKEN` | Private build credential; never use a NEXT_PUBLIC prefix. |
| `SENTRY_UPLOAD_SOURCEMAPS` | Explicitly set `true` to authorize build-time upload. |

Public variables are baked into the browser build: changing them requires a new
build/deployment. Development reporting remains off even if a DSN is configured.
Preview builds should use a staging environment label or a separate Sentry
project. Existing Infisical environment slugs remain dev/staging/prod.

The Next config allows only the configured DSN's exact ingest origin in CSP,
not a wildcard. An invalid/missing DSN leaves the SDK inactive. Self-hosted DSNs
with a URL path prefix are not supported by the current strict DSN validator.

## Source maps

SDK 11 imports the build wrapper from `@sentry/nextjs/config`. Source map uploads
are disabled unless the explicit upload flag, org, project and private token
are all present. With upload enabled, the SDK uploads generated maps and deletes
its generated maps after upload. Do not turn on `productionBrowserSourceMaps`
or publish maps separately. SDK build telemetry is disabled.

No source maps were uploaded during this implementation. After credentials and
deployment are authorized, verify a deliberately triggered, non-sensitive error
in a dedicated test environment and confirm its source locations in Sentry.
Never trigger a fake production outage to test the integration.

## Capture policy

- `src/instrumentation-client.ts` initializes browser error capture.
- `src/instrumentation.ts` registers Node/edge SDK config and forwards unexpected
  `onRequestError` events. Node OpenTelemetry setup is disabled because tracing
  is out of scope.
- Root, public, dashboard and global error boundaries use `useReportError`.
  It suppresses duplicate reporting of the same Error object and never allows
  a monitoring import failure to break the fallback UI.
- `src/lib/monitoring.ts` removes user identity, contexts, extra dumps,
  breadcrumbs, headers, cookies, request bodies and URL queries/fragments.
  It redacts recognizable secret assignments, bearer/JWT tokens and email
  addresses in messages, removes frame variables and preserves source lines.
- Request errors retain four bounded diagnostic tags: `next.route_type`,
  `next.render_source`, `next.revalidate_reason`, and `next.resume`. Values are
  allowlisted enums/booleans; the resume header contributes only true/false.
  Unknown tag values are removed. This adds no request payload or identity.
- Client reports, breadcrumbs and automatic browser/process session telemetry
  are disabled. The local SDK transport test
  confirms the resulting error envelope, not only the helper's return value.
- Expected Next not-found and redirect control flow is not an exception report.
  Invalid credentials, cancelled passkeys and validation messages are not
  manually reported. Do not add form payloads or auth tokens as event context.

Application-specific error messages can still contain data that generic pattern
filters cannot identify. Keep errors descriptive without embedding raw content,
and retain Sentry's server-side data-scrubbing rules as a second layer.

## Recovery UI and HTTP status

`SpaceState` provides the public 404 artwork with supplied Earth/transparent
astronaut assets, sparse stars and reduced-motion support. Root and scoped
not-found components share it. CMS missing-item states remain a small dashboard
recovery view. Unexpected errors show retry/navigation without internal messages.

Missing public details are checked before streaming in `src/proxy.ts`. Its
`/not-found` rewrite destination is deliberately unmatched, so Next serves the
pre-rendered root not-found boundary without async public footer data or a
page-level notFound() streaming handoff. Direct requests also return 404. Unknown slugs, drafts and future
articles retain existing publication/authorization rules. A database failure
is still an unexpected error, never disguised as missing content.

Next.js 16.4 uses the stable `retry` error-boundary prop; `unstable_retry` is no
longer passed. The real browser retry fixture verifies the fallback can recover.
The minimal global fallback uses its own document and inline navy colors because
it must work if the root layout or global stylesheet fails.

## Verification

Run the Vitest monitoring/security and recovery component suites, then the full
suite, lint, TypeScript and a production build. Browser checks use a running local
app with an isolated repository Playwright CLI session:

```powershell
bunx --no-install playwright-cli -s=recovery open http://localhost:3000/not-found --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=recovery run-code --filename=tests/browser/recovery-boundaries.js
bunx --no-install playwright-cli -s=recovery close
```

For the optional retry fixture, copy `tests/fixtures/recovery/page.tsx` into
`src/app/(public)/boundary-fixture-check/page.tsx`, then run
`tests/browser/error-boundary-retry.js` in the same way. Remove that temporary
route before building or committing. The fixture contains no real credentials.
It was removed after this task's browser check.

Evidence and limitations are recorded under `task/boundary-sentry/`.
