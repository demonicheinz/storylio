# Sentry triage — 2026-10-31

Read-only Sentry inspection found four unresolved issues in the last 14 days.
No Sentry issue state, deployment, credential or CMS record was changed.

| Issue | Evidence | Status |
| --- | --- | --- |
| STORYLIO-2, 7817577231 | Testimonial count; two events, old release 643ce33 | Query absent in 723fa99 and HEAD; production Overview loaded successfully. |
| STORYLIO-3, 7817577316 | Testimonial list; one event 2026-10-29 00:37:40 UTC, release 643ce33 | Query absent in current source; production Home editor loaded successfully. |
| STORYLIO-1, 7817577163 | Generic RSC error; event 2026-10-29 00:37:34 UTC, release 643ce33, no stack | Historical; association with DB issues is plausible, not proven. |
| STORYLIO-4, 7819879307 | Resumable-slot replay mismatch, 50 production events in release 723fa99; latest observed 2026-10-31 13:19:13 UTC | Not reproduced locally and not claimed fixed. |

STORYLIO-4 contains only minified Next runtime frames, without an application
component frame. Existing privacy policy discards raw contexts and headers.
Request instrumentation now retains four allowlisted tags (render type/source,
revalidation reason, resume true/false) without retaining cookies, query strings,
request contents or user identity. This is diagnostic hardening, not a replay fix.

## Local reproduction attempts

Used the existing Next 16.4.2 production build via its direct minimal-mode server
handler, matching the next-resume POST path in installed framework source.
Actual postponed state from index.meta was posted for / and an unknown note query.
Both returned 200 with a completed resume and no $RX fallback. Ordinary custom
server routing first returned 405; direct NextServer was needed to reach resume.

An isolated generated-build mutation simulated an empty Notes collection during
resume against the original postponed state. That also returned 200 without a
fallback. The generated chunk was restored byte-for-byte and the server stopped.
No database mutations were made. These checks rule out those local scenarios;
they do not simulate Vercel's stored cache or establish the production cause.

## Follow-up after deployment

Keep STORYLIO-4 open. Inspect a new event from the deployed fix release using the
bounded tags and corresponding Vercel runtime log. Compare revalidation vs ordinary
resume before making a rendering/cache change. Do not hide this error in
beforeSend, disable global partial prefetching, or mark resolved on local build
success. The older generic issue also lacks proof for a guaranteed resolution.

References: installed next/dist/server/base-server.js and instrumentation/types.d.ts;
[Sentry captureRequestError source](https://github.com/getsentry/sentry-javascript/blob/develop/packages/nextjs/src/common/captureRequestError.ts).
Upstream [Next issue 96289](https://github.com/vercel/next.js/issues/96289) has the
same message but concerns optional catch-all routes, which Storylio Home is not.
Next 16.4.3 release notes do not identify a matching fix; no speculative version
change or route-rendering workaround was applied.

## Verification of diagnostic changes

Both added tests failed against the original capture/filter behavior. The final
full run passed 105 files / 805 tests; production build passed 38/38 pages and
TypeScript. No sample exception was sent to the real Sentry project. The bounded
tags will be available only after this branch is deployed; current production
still reports release 723fa99 in the events inspected during triage.
