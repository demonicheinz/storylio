# Sign-in/logout loader regression

## Cause and evidence

`next.config.ts` enables `cacheComponents: true` and `partialPrefetching: true`.
Installed Next 16.4.2 documentation in
`node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md` states that
Activity hides pages, preserves state/refs/DOM, cleans up effects, and runs effects
again on restoration. `use-router.md` also documents that refresh merges RSC
without discarding unaffected client state. Session reads on the sign-in page
are request-time and remain unchanged.

The old form kept `pending="redirect"` and `lock.current=true` after success.
Its cleanup only changed `mounted` and aborted conditional WebAuthn. Its only
reset was `pageshow.persisted`, which does not fire on an Activity restore.
Logout used `router.push` followed by `router.refresh` and ignored returned
sign-out errors. AuthEntrance has a 900ms completion timer and interaction
handlers; the reproduction identifies submission state, not entrance, as the
stuck loader.

Before editing production code, the isolated Chromium fixture failed for all
four redirect/restore variants: password, passkey, OAuth, and MFA. The restored
form remained disabled. Returned logout errors navigated away, while thrown
logout errors produced an unhandled `fixture network failure` and no feedback.
The fresh-document logout check failed because the old code used SPA navigation.

## Change

- `sign-in-form.tsx`: reset pending/error/lock in layout-effect cleanup when
  Activity hides the form. Advance a lifecycle generation on cleanup and BFCache
  restoration so earlier async responses cannot navigate, release a newer lock,
  or overwrite current errors. Preserve the lock through a successful redirect
  until actual departure. Synchronous navigation exceptions now release it.
- `nav-user.tsx`: check the sign-out result, catch thrown failures, show a generic
  retryable error outside the closing menu, and prevent duplicate requests.
  After success, `window.location.replace('/sign-in')` creates a fresh document,
  discarding the authenticated in-memory route cache and reading the updated
  cookie on the server. Only logout uses this document boundary.
- New auth-only fixture and browser checks under `tests/fixtures/auth-navigation/`
  and `tests/browser/auth-navigation.js`. No dependencies added.

No auth server, account, configuration, Settings, MFA implementation, AuthFlow,
or AuthEntrance changes. Other agents' working changes are preserved. No commit.

## Verification

- Chromium: 13 scenarios passed, zero unhandled runtime errors. Covers all four
  restore paths, stale success/rejection after restoration, BFCache pending
  reset, duplicate submission, redirect lock, navigation exception, failed
  logout/retry, fresh document on logout, and duplicate logout.
- `bunx --no-install tsc --noEmit --incremental false`: passed.
- Scoped `biome check`: passed. `git diff --check`: passed.
- Focused Vitest run: 34 tests passed across four suites; the background-task
  suite timed out during its 30-second import/setup hook. Its isolated rerun
  passed (1 test, 12.12 seconds total), making 35 passing focused tests.

## Limits and handoff

The fixture uses actual React Activity and production components but mocks Next
hooks and auth. It proves client lifecycle behavior, not real Next RSC/session
integration or browser BFCache eligibility. Passkeys are mocked; no real sign-out,
accounts, secrets, database, or email were used. No production build was run by
this worker. The parent can run its existing integrated fixture separately.

The requested `docs/CODEX-NAVIGATION-GUIDE.md` does not exist in this checkout;
the root instructions, cache guide, README testing section, and installed Next
docs were read instead.

## Self-evaluation

Accuracy 4/5: client behavior reproduced before the fix and 13 browser checks
pass; full Next RSC integration remains unverified. Completeness 4/5: requested
restore/race/logout failures covered, with real auth deliberately excluded.
Clarity 5/5: cause, files, checks, and limits recorded separately. Actionability
5/5: uncommitted patch and a repeatable credential-free fixture are ready for the
parent. Conciseness 4/5: the browser harness is substantial but covers 13 distinct
failure paths. Overall 4.4/5. Improvement: parent can verify the integrated Next
navigation with mocked session endpoints. No blocking issue remains. The user
should agree given the reproduced failure and explicit integration limit.
