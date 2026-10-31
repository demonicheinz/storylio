# Runtime audit fixes

## Autosave during publication

Blank autosaves now require DRAFT status in the UPDATE predicate itself. This
closes the gap between the earlier status read and the write without changing
nonblank autosaves or explicit publishing. If publication wins that race, the
failed update throws inside the transaction and rolls back tag/screenshot edits.

Two deterministic PGlite regressions failed before the fix. Afterward all 34
editor-autosave, project batch-publication and management tests passed. The tests
publish a valid draft immediately before the autosave transaction, then verify
published content and its tags/screenshots remain intact. TypeScript passed.
No external database or CMS data changed. Known low deepmerge advisory unchanged.

## Committed writes and cache failures

`src/lib/revalidation.ts` contains post-commit wrappers for the installed Next
path/tag invalidation signatures. Each attempt logs a bounded error and lets
subsequent invalidations continue. Seven CMS action modules use the same policy
for create/update/delete/reorder and settings/session changes. Existing Media
and Upload already have guarded invalidation and retain their behavior.

Four new integration cases (Posts/Projects, tag/path failure) failed before the
fix. After the fix they verify successful create/autosave results and actual SQL
content despite cache failures. The wrapper test preserves dynamic route-type
arguments, tag arguments, attempts remaining paths, and avoids logging arbitrary
error details. Focused actions suites passed 38 tests; focused monitoring/cache
suites passed 21 tests. Full suite/build final results are appended separately.

This reports database success accurately; if cache invalidation really fails,
public pages can remain stale until their cache lifetime or a later successful
invalidation. It does not pretend database and cache form one transaction.
