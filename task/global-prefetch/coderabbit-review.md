# CodeRabbit review — 2026-10-25

Follow-up: all three findings were addressed and verified after user approval.
See `coderabbit-fixes.md` for the implementation and final checks. The findings
below retain the original review evidence.

Verdict: request changes. All three findings are valid. This review does not
modify application code or browser tests.

## Missing article and project responses

Both detail entry points render `PublicRouteBoundary` before their async child
resolves the slug and checks published content. The child then calls `notFound`
after the response can already have started streaming.

Reproduced against the existing production build (Next.js 16.4.2), started with
`bun run start --port 3002`, using native fetch, a Mozilla browser user agent,
and a fresh UUID slug for each route. No browser prefetch was involved.

| Cold request | HTTP status | noindex in HTML | NEXT_HTTP_ERROR_FALLBACK;404 in payload |
| --- | --- | --- | --- |
| /blog/review-missing-{UUID} | 200 | yes | yes |
| /projects/review-missing-{UUID} | 200 | yes | yes |

Missing slugs are confirmed. Unpublished and scheduled fixtures were not added
to the external database. Those paths share the same null-result handling.

The proposed page-only fix needs qualification: `src/app/(public)/layout.tsx`
already wraps its children in a Suspense boundary with a null fallback. Moving
the lookup above the page boundary therefore does not by itself establish that
headers remain uncommitted. This parent boundary predates the pending migration;
these results establish a current defect, not when it was introduced.

If strict HTTP 404 is required while retaining global partial rendering, use a
small published-content existence check before rendering, for example in Proxy.
Check only the required identifier, apply the same publication predicates
(including blog publication date), avoid involving public paths in dashboard
authentication, and retain the page's notFound check for concurrent changes.
Do not add an unreviewed permanent slug list or disable global partial caching.
Any implementation must verify actual cold HTTP statuses and the intended 404
UI, including RSC navigation, valid published slugs, drafts, and future posts.

Installed authoritative reference:
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`,
Status codes. Context7 also confirmed the streaming HTTP contract and that
dynamicParams is incompatible with Cache Components.

## Persistent no-WebGL script

`tests/browser/gooey-navigation.js:127` registers a page-level init script that
replaces canvas getContext for every subsequent document on that page. The final
cleanup resets media preferences and event handlers, but cannot remove that
script. A subsequent run in the persistent CLI page will still disable WebGL2,
contradicting the earlier assertion that the canvas becomes visible after
reduced motion is disabled. Confirmed by source inspection; two browser runs
were not executed during this review.

Run this scenario on a new page and close that page in finally. Attach both
pageerror and relevant console listeners to the temporary page. Retain the
existing fallback navigation assertion: the suggested patch checks the pill
only, whereas the current test also navigates to Projects. Parameterize the
navigation/state helpers by page or perform equivalent checks on the new page.
Verify by running the complete command twice in the same CLI session.

## Review self-evaluation

Accuracy 4/5: cold HTTP evidence is concrete; browser persistence is inspected,
not runtime-reproduced. Completeness 4/5: all findings covered; no draft fixtures
or fix validation. Clarity 5/5: evidence and recommendations are distinguished.
Actionability 4/5: concrete patch direction and regression checks provided;
implementation remains separate. Conciseness 4/5: this artifact carries details
while the user-facing result stays brief. Overall 4.2/5.

Next improvements: validate the isolated-page change with two consecutive runs;
verify a chosen pre-stream 404 implementation in production mode. Self-check:
the review is useful for deciding the next change, without claiming a fix.
